import { rabbitMQ } from "./rabbitMQ"; // Use the RabbitMQ class from above
import { startConversation } from "./converter";
import { TaskType } from "./TaskQueue";
import { logger } from "./logger";
import { proccessMessageBuilder } from "./messages";
import cluster from "cluster";

export const startWorker = async () => {
  await rabbitMQ.connect();
  await rabbitMQ.listenForGlobalMessages();

  rabbitMQ.consumeFromQueue("task_queue", async (msg) => {
    const task: TaskType = JSON.parse(msg.content.toString());
    task.status = "PROCESSING";
    task.updatedAt = Date.now();
    console.log("WORKER SEND PROCESSING");
    await rabbitMQ.publishToQueue("result_queue", JSON.stringify(task));

    logger.info(
      proccessMessageBuilder({
        task,
        message: `Worker ${cluster.worker.id} processing task: ${task.id}`,
      })
    );

    try {
      const results = await startConversation(task);
      task.status = "COMPLETED";
      task.results = results;

      await rabbitMQ.publishToQueue("result_queue", JSON.stringify(task));
      rabbitMQ.acknowledgeMessage(msg);

      logger.info(
        proccessMessageBuilder({
          task,
          message: `Worker ${cluster.worker.id} completed task: ${task.id}`,
        })
      );
    } catch (error) {
      task.status = "FAILED";
      task.error = error.message;

      await rabbitMQ.publishToQueue("result_queue", JSON.stringify(task));
      rabbitMQ.acknowledgeMessage(msg);

      logger.info(
        proccessMessageBuilder({
          task,
          message: `Worker ${cluster.worker.id} failed task: ${task.id}`,
        })
      );
    }
  });
};
