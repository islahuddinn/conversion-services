import PQueue from "@esm2cjs/p-queue";
import { ENV } from "../constants/environments";
import { logger } from "./logger";
import { PostItemType } from "../type/entities";
import axios from "axios";
import { db } from "./database";
import { proccessMessageBuilder } from "./messages";
import { rabbitMQ } from "./rabbitMQ";

export type ProcessingTaskResultType = Array<{
  postItem: PostItemType;
  results: string[];
}>;
export type TaskType = {
  id: number;
  PostItems: PostItemType[];
  status: "PENDING" | "PROCESSING" | "FAILED" | "COMPLETED";
  updatedAt: number;
  createdAt: number;
  retryCount: number;
  callbackDeliveryTryCount: number;
  callbackUrl: string;
  results: ProcessingTaskResultType;
  error: string;
  refID: string;
  callBackError: string;
};

const callbackConcurrencyLimit = parseInt(ENV.MAX_CONVERTING_POOL_SIZE, 10);
const MAX_RETRIES = 1;

class TaskQueue {
  queue: PQueue;
  callbackQueue: PQueue;
  pendingTasks: Set<TaskType>;
  processingTasks: Set<TaskType>;
  failedTasks: Set<TaskType>;
  completedTasks: Set<TaskType>;

  async initialize() {
    this.queue = new PQueue();
    this.callbackQueue = new PQueue({ concurrency: callbackConcurrencyLimit });
    this.pendingTasks = new Set();
    this.processingTasks = new Set();
    this.failedTasks = new Set();
    this.completedTasks = new Set();
    const rows = db.prepare("SELECT * FROM tasks").all();
    logger.info(
      `${rows.length} items found from database, adding to queue ... `
    );
    for (const row of rows) {
      const task = this.deserializeTask(row);
      this.addTaskToMemory(task);
    }

    rabbitMQ.consumeFromQueue("result_queue", (msg) => {
      const result = JSON.parse(msg.content.toString());
      rabbitMQ.acknowledgeMessage(msg);

      const task: TaskType = this.searchTaskById(result.id);

      if (task) {
        if (result.status === "COMPLETED") {
          this.moveToCompleted(task, result.results);
        } else if (result.status === "FAILED") {
          this.handleRetry(task);
        } else if (result.status === "PROCESSING") {
          this.moveToProcessing(task);
        }
      }
    });
  }

  addTask(task: TaskType) {
    const stmt = db.prepare(`
      INSERT INTO tasks (id, postItems, status, updatedAt, createdAt, retryCount, callbackUrl, results, error,callbackDeliveryTryCount,refID,callBackError)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      task.id,
      JSON.stringify(task.PostItems),
      task.status,
      task.updatedAt,
      task.createdAt,
      task.retryCount,
      task.callbackUrl,
      JSON.stringify(task.results || []),
      task.error || "",
      task.callbackDeliveryTryCount || 0,
      task.refID,
      task.callBackError || ""
    );

    this.addTaskToMemory(task);
  }

  private addTaskToMemory(task: TaskType) {
    task.status = "PENDING";
    task.updatedAt = Date.now();
    task.retryCount = 0;
    task.callbackDeliveryTryCount = 0;
    this.pendingTasks.add(task);
    this.queue.add(() => this.processTask(task));
  }

  private async processTask(task: TaskType) {
    logger.info(
      proccessMessageBuilder({ message: `Task started processing.`, task })
    );
    await rabbitMQ.publishToQueue("task_queue", JSON.stringify(task));
    logger.info(
      proccessMessageBuilder({
        message: `Task ${task.id} sent to RabbitMQ task_queue.`,
        task,
      })
    );
  }

  private moveToProcessing(task: TaskType) {
    logger.info(
      proccessMessageBuilder({ message: `Task moved to processing.`, task })
    );
    this.pendingTasks.delete(task);
    this.updateTaskInDatabase(task, "PROCESSING");
    task.status = "PROCESSING";
    task.updatedAt = Date.now();
    this.processingTasks.add(task);
  }

  private moveToCompleted(task: TaskType, results: ProcessingTaskResultType) {
    logger.info(proccessMessageBuilder({ message: `Task completed.`, task }));
    this.processingTasks.delete(task);
    this.updateTaskInDatabase(task, "COMPLETED");
    task.status = "COMPLETED";
    task.updatedAt = Date.now();
    task.results = results;
    this.completedTasks.add(task);

    this.callbackQueue.add(() => this.sendCallback(task));
  }

  private async sendCallback(task: TaskType) {
    try {
      const isFailed = task.status === "FAILED";
      const response = await axios.post(task.callbackUrl, {
        results: task.results,
      });
      if (response.status === 200) {
        logger.info(
          proccessMessageBuilder({
            message: `Task ${task.id} successfully sent to ${
              task.callbackUrl
            } ${JSON.stringify(response.data)}`,
            task,
          })
        );

        if (isFailed) {
          this.failedTasks.delete(task);
        } else {
          this.completedTasks.delete(task);
        }
        logger.info(
          proccessMessageBuilder({
            message: `Task removed from the memory.`,
            task,
          })
        );

        this.removeTaskFromDatabase(task.id);
      } else {
        task.callBackError = JSON.stringify(response.data);
        this.scheduleCallbackRetry(task);
        logger.info(
          proccessMessageBuilder({
            message: `Failed to send task ${task.id} results to ${task.callbackUrl}. Status: ${response.status}`,
            task,
          })
        );
      }
    } catch (error) {
      task.callBackError = error.message;
      this.scheduleCallbackRetry(task);
      logger.info(
        proccessMessageBuilder({
          message: `Failed to send task ${task.id} results to ${task.callbackUrl}.`,
          task,
        })
      );
    }
  }

  private removeTaskFromDatabase(taskId: number) {
    const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
    stmt.run(taskId);
    logger.info(
      proccessMessageBuilder({
        message: `Task ${taskId} removed from the database.`,
      })
    );
  }

  private scheduleCallbackRetry(task: TaskType) {
    const time = parseInt(ENV.DELIVERY_RETRY_INTERVAL, 10) | 5000;
    setTimeout(() => {
      logger.info(
        proccessMessageBuilder({
          message: `Retrying to send callback for task ${task.id} to callback URL`,
          task,
        })
      );
      task.callbackDeliveryTryCount = task.callbackDeliveryTryCount + 1;
      this.callbackQueue.add(() => this.sendCallback(task));
    }, time);
  }

  private moveToFailed(task: TaskType) {
    logger.info(
      proccessMessageBuilder({
        message: `Task ${task.id} moved to failed.`,
        task,
      })
    );
    this.processingTasks.delete(task);
    this.updateTaskInDatabase(task, "FAILED");
    task.status = "FAILED";
    task.updatedAt = Date.now();
    this.failedTasks.add(task);
    this.callbackQueue.add(() => this.sendCallback(task));
  }

  private async handleRetry(task: TaskType) {
    if (task.retryCount && task.retryCount >= MAX_RETRIES) {
      this.moveToFailed(task);

      logger.info(
        proccessMessageBuilder({
          message: `Task ${task.id} failed permanently after ${MAX_RETRIES} retries.`,
          task,
        })
      );
    } else {
      task.retryCount = task.retryCount + 1;
      task.updatedAt = Date.now();

      logger.info(
        proccessMessageBuilder({
          message: `Task ${task.id} retry attempt #${task.retryCount}.`,
          task,
        })
      );
      await this.processTask(task);
    }
  }

  getPendingTasks(): TaskType[] {
    return Array.from(this.pendingTasks);
  }

  getProcessingTasks(): TaskType[] {
    return Array.from(this.processingTasks);
  }

  getFailedTasks(): TaskType[] {
    return Array.from(this.failedTasks);
  }

  getCompletedTasks(): TaskType[] {
    return Array.from(this.completedTasks);
  }

  removeTaskById(id: number) {
    const task = this.searchTaskById(id);

    if (task) {
      this.pendingTasks.delete(task);
      this.processingTasks.delete(task);
      this.failedTasks.delete(task);
      this.completedTasks.delete(task);
      this.removeTaskFromDatabase(id);
      return true;
    }
    return false;
  }

  searchTaskById(id: number): TaskType | undefined {
    return [
      ...this.pendingTasks,
      ...this.processingTasks,
      ...this.failedTasks,
      ...this.completedTasks,
    ].find((task) => task.id === id);
  }

  private updateTaskInDatabase(task: TaskType, status: string) {
    const stmt = db.prepare(`
      UPDATE tasks
      SET status = ?, updatedAt = ?, results = ?, error = ?, retryCount = ?
      WHERE id = ?
    `);
    stmt.run(
      status,
      Date.now(),
      JSON.stringify(task.results || []),
      task.error || "",
      task.retryCount,
      task.id
    );
  }

  private deserializeTask(row) {
    return {
      id: row.id,
      PostItems: JSON.parse(row.postItems),
      status: row.status,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      retryCount: row.retryCount,
      callbackUrl: row.callbackUrl,
      results: JSON.parse(row.results),
      error: row.error,
      callbackDeliveryTryCount: row.callbackDeliveryTryCount,
      refID: row.refID,
      callBackError: row.callBackError,
    };
  }
}

export default new TaskQueue();
