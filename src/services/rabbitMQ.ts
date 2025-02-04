import amqplib, { Channel, Connection, ConsumeMessage } from "amqplib";
import { ENV } from "../constants/environments";
import { logger } from "./logger";
import cluster from "cluster";
const concurrencyLimit = parseInt(ENV.MAX_CONVERTING_POOL_SIZE, 10);
export const GLOBAL_MESSAGING = "broadcast_global";

type GlobalMessageType = {
  type: "UPDATE_CONCURRENCY_LIMIT";
  data: any;
};

class RabbitMQ {
  connection: Connection;
  channel: Channel;
  limit: number;

  async connect() {
    this.connection = await amqplib.connect(
      ENV.RABBITMQ_URL || "amqp://localhost"
    );
    this.channel = await this.connection.createChannel();
    this.limit = concurrencyLimit;
    this.channel.prefetch(concurrencyLimit, true);
  }

  async setupGlobalMessaging() {
    try {
      await rabbitMQ.channel.deleteExchange(GLOBAL_MESSAGING);
      console.log(`Exchange ${GLOBAL_MESSAGING} refreshed.`);
    } catch (error) {
      console.error(`Error deleting exchange: ${error.message}`);
      if (!error.message.includes("not found")) {
        throw error;
      }
    } finally {
      await rabbitMQ.channel.assertExchange(GLOBAL_MESSAGING, "fanout", {
        durable: false,
      });
    }
  }

  async listenForGlobalMessages() {
    const queueName = `worker_${cluster.worker.id}`;
    const queue = await rabbitMQ.channel.assertQueue(queueName, {
      exclusive: true,
    });
    logger.info(
      `#### Worker ${cluster.worker.id} listening for global messages ####`
    );
    await rabbitMQ.channel.bindQueue(queue.queue, GLOBAL_MESSAGING, "");

    rabbitMQ.channel.consume(queue.queue, (msg) => {
      logger.info(
        `#### Global message received: ${msg.content.toString()} by worker ${
          cluster.worker.id
        } ####`
      );
      if (msg) {
        const message = msg.content.toString();
        const globalMessage: GlobalMessageType = JSON.parse(message);
        switch (globalMessage.type) {
          case "UPDATE_CONCURRENCY_LIMIT":
            this.setConcurrencyLimit(globalMessage.data);
            break;
          default:
            break;
        }

        rabbitMQ.channel.ack(msg);
      }
    });
  }

  async setConcurrencyLimit(limit: number) {
    this.limit = limit;
    await this.channel.prefetch(limit, true);
  }

  getConcurrencyLimit() {
    return this.limit;
  }

  async initiateQueues() {
    await this.channel.assertQueue("task_queue", { durable: true });
    await this.channel.assertQueue("result_queue", { durable: true });
  }

  async clearQueues() {
    const queues = ["task_queue", "result_queue"];

    for (const queue of queues) {
      try {
        await this.channel.checkQueue(queue);
        await this.channel.deleteQueue(queue);
        logger.info(`#### RabbitMQ Queue "${queue}" cleared. ####`);
      } catch (error) {
        if (error.code === 404) {
          logger.info(
            `#### RabbitMQ Queue "${queue}" does not exist, skipping. ####`
          );
        } else {
          logger.error(`#### Error checking/deleting queue "${queue}":`, error);
        }
      }
    }
  }

  async consumeFromQueue(
    queueName: string,
    onMessage: (msg: ConsumeMessage) => void
  ) {
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.consume(queueName, (msg) => {
      if (msg) {
        onMessage(msg);
      }
    });
  }

  async publishToQueue(queueName: string, message: string) {
    await this.channel.assertQueue(queueName, { durable: true });
    this.channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
    });
  }
  acknowledgeMessage(msg: ConsumeMessage) {
    this.channel.ack(msg);
  }

  rejectMessage(msg: ConsumeMessage, requeue = false) {
    this.channel.nack(msg, false, requeue);
  }

  broadcastGlobalMessage(globalMessage: GlobalMessageType) {
    rabbitMQ.channel.publish(
      GLOBAL_MESSAGING,
      "",
      Buffer.from(JSON.stringify(globalMessage))
    );
    logger.info(
      `#### Broadcasted global message: ${JSON.stringify(globalMessage)}  ####`
    );
  }
}

export const rabbitMQ = new RabbitMQ();
