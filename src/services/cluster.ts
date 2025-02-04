import cluster from "cluster";
import { startPrimaryApp } from "../app";
import { logger } from "./logger";
import os from "os";
import { startWorker } from "./worker";
import { ENV } from "../constants/environments";

const workers = {};

export const startCluster = async () => {
  if (cluster.isPrimary) {
    logger.info(`#### Initialising Task Queue...  #### `);

    logger.info(`#### Master process ${process.pid} is running ####`);

    const cpuCount = os.cpus().length;
    const maximumWorkerCount =
      parseInt(ENV.MAX_CLUSTRING_NODES_COUNT, 10) || cpuCount;
    const minimumWorkerCount = parseInt(ENV.MIN_CLUSTRING_NODES_COUNT, 10) || 1;

    const finalWorkerCount = Math.max(
      minimumWorkerCount,
      Math.min(cpuCount, maximumWorkerCount)
    );

    for (let i = 0; i < finalWorkerCount; i++) {
      logger.info(`#### Forking worker process ${i} ####`);
      const worker = cluster.fork();

      workers[worker.id] = {
        id: worker.id,
        pid: worker.process.pid,
      };
    }

    startPrimaryApp();
    cluster.on("fork", (worker) => {
      workers[worker.id] = { id: worker.id, pid: worker.process.pid };
      logger.info(`Worker ${worker.id} started with PID ${worker.process.pid}`);
    });

    cluster.on("exit", (worker) => {
      logger.info(`Worker ${worker.id} exited. Removing from list...`);
      delete workers[worker.id];

      const freshWorker = cluster.fork();
      logger.info(`#### Forking worker process ${freshWorker.id} ####`);

      workers[freshWorker.id] = {
        id: freshWorker.id,
        pid: freshWorker.process.pid,
      };
    });
  } else {
    startWorker();
  }
};

const getWorkers = () => {
  return Object.values(workers);
};

const addWorker = () => {
  const worker = cluster.fork();
  return { id: worker.id, pid: worker.process.pid };
};

const stopWorker = (workerId) => {
  const worker = cluster.workers[workerId];
  if (worker) {
    worker.kill();
    return true;
  }
  return false;
};

export const clusterOptions = {
  getWorkers,
  stopWorker,
  addWorker,
};
