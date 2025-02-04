import express from "express";
import auth from "http-auth";
import { ENV } from "./constants/environments";
import TaskQueue, { TaskType } from "./services/TaskQueue";
import { extractAttachmentsFromPost } from "./utils/post";
import path from "path";
import swaggerUi from "swagger-ui-express";
import yaml from "yaml";
import fs from "fs";
import { parseUrl } from "./utils/common";
import { logger } from "./services/logger";
import { v4 as uuidv4 } from "uuid";
import readLastLines from "read-last-lines";
import * as m3u8Parser from "m3u8-parser";
import axios from "axios";
import { clusterOptions } from "./services/cluster";
import { rabbitMQ } from "./services/rabbitMQ";

const swaggerOptions = {
  definition: yaml.parse(fs.readFileSync("./swagger.yaml", "utf8")),
};

export const startPrimaryApp = async () => {
  const app = express();

  const basic = auth.basic(
    { realm: "Monitor Area" },
    function (user, pass, callback) {
      callback(
        user === ENV.MONITORING_USERNAME && pass === ENV.MONITORING_PASSWORD
      );
    }
  );
  const swaggerDocs = swaggerOptions.definition;

  const { host, port } = parseUrl(ENV.LOAD_BALANCER_URL);

  const statusMonitor = require("express-status-monitor")({
    title: "Propagator Status Monitoring Panel",
    path: "",
    healthChecks: [
      {
        protocol: "http",
        host: host,
        path: "/admin/health",
        port: port,
      },
    ],
  });
  app.use(statusMonitor.middleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/status", basic.check(statusMonitor.pageRoute));

  app.use(express.static("storage"));

  app.post("/callback", async (req, res) => {
    res.json(req.body);
  });

  app.set("view engine", "ejs");

  app.set("views", path.join(__dirname, "views"));

  const monitorAuthMiddleware = (req, res, next) => {
    basic.check((isAuthenticated) => {
      if (!isAuthenticated) {
        res.set("WWW-Authenticate", basic.generateHeader());
        return res.status(401).send("Unauthorized");
      }
      next();
    })(req, res);
  };

  app.get("/admin/health", (_, res) => {
    res.json({ status: "ok" });
  });

  app.post("/admin/restart", (req, res) => {
    try {
      const API_KEY = req.headers["x-api-key"];
      if (ENV.COMMUNICATION_API_KEY !== API_KEY) {
        throw new Error("Invalid API Key.");
      }
      logger.info("#### Received restart request. Restarting worker... ####");

      res.json({ message: "Restart initiated.", status: 200 });
      process.exit(12);
    } catch (error) {
      res.status(400).json({
        message: error.message,
        status: 400,
      });
    }
  });

  app.get("/link-analysis", monitorAuthMiddleware, (req, res) => {
    res.render("link-analysis", { metadata: null, error: null, m3u8Url: null });
  });

  app.post("/fetch-m3u8", async (req, res) => {
    const { m3u8Url } = req.body;

    try {
      const response = await axios.get(m3u8Url);
      const parser = new m3u8Parser.Parser();
      parser.push(response.data);
      parser.end();

      const manifest = parser.manifest;

      const metadata = {
        segments:
          manifest?.segments?.map((segment) => ({
            uri: segment.uri,
            duration: segment.duration,
          })) || [],
        playlists:
          manifest?.playlists?.map((playlist) => ({
            uri: playlist.uri,
            attributes: playlist.attributes,
          })) || [],
        mediaGroups: manifest.mediaGroups || [],
      };

      res.render("link-analysis", { metadata, error: null, m3u8Url });
    } catch (error) {
      console.log(error);
      res.render("link-analysis", {
        metadata: null,
        error: "Failed to fetch the m3u8 file.",
        m3u8Url: null,
      });
    }
  });

  app.get("/monitor", monitorAuthMiddleware, (req, res) => {
    const pendingTasks = TaskQueue.getPendingTasks();
    const processingTasks = TaskQueue.getProcessingTasks();
    const failedTasks = TaskQueue.getFailedTasks();
    const completedTasks = TaskQueue.getCompletedTasks();
    const concurrencyLimit = rabbitMQ.getConcurrencyLimit();

    res.render("monitor", {
      pendingTasks,
      processingTasks,
      failedTasks,
      completedTasks,
      concurrencyLimit,
    });
  });

  app.get("/", monitorAuthMiddleware, (_, res) => {
    res.render("home");
  });

  app.get("/logs", monitorAuthMiddleware, async (req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const logFilePath = path.join(__dirname, `../logs/${today}.log`);

    if (fs.existsSync(logFilePath)) {
      try {
        const logContent = await readLastLines.read(logFilePath, 1000);
        res.render("logs", {
          today,
          logContent: logContent
            .split("\n")
            .reverse()
            .map((i) => `${i} \r\n`),
        });
      } catch (error) {
        res.render("logs", { today, logContent: "Error reading log file." });
      }
    } else {
      res.render("logs", { today, logContent: "No logs available for today." });
    }
  });

  app.post("/convert", async (req, res) => {
    try {
      const API_KEY = req.headers["x-api-key"];
      if (ENV.COMMUNICATION_API_KEY !== API_KEY) {
        throw new Error("Invalid API Key.");
      }

      const { Id: id, PostItems, callbackUrl } = req.body;

      if (typeof id !== "number" || isNaN(id)) {
        throw new Error("Invalid 'id'. It must be a valid number.");
      }

      if (!PostItems || PostItems.length === 0) {
        throw new Error("Invalid 'PostItems'. It must be a non-empty array.");
      }

      if (!PostItems.includes("http") && !PostItems.includes("https")) {
        throw new Error("Invalid 'PostItems'. It must include a valid URL.");
      }

      if (typeof callbackUrl !== "string" || !isValidUrl(callbackUrl)) {
        throw new Error("Invalid 'callbackUrl'. It must be a valid URL.");
      }

      const foundTask = TaskQueue.searchTaskById(id);
      if (foundTask) {
        throw new Error("Task already exists in the queue.");
      }

      const parsedPostItems = extractAttachmentsFromPost(PostItems);
      const refID = uuidv4();
      const task: TaskType = {
        id,
        status: "PENDING",
        callbackUrl,
        PostItems: parsedPostItems,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        results: [],
        error: "",
        retryCount: 0,
        callbackDeliveryTryCount: 0,
        refID,
        callBackError: "",
      };

      TaskQueue.addTask(task);

      res.json({
        message: `Task ${id} added to the queue.`,
        task,
        status: 200,
        refID,
      });
    } catch (e) {
      res.status(400).json({
        message: e.message,
        status: 400,
      });
    }
  });

  function isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  app.use(
    "/api-docs",
    monitorAuthMiddleware,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs)
  );

  app.get("/followup/task/:id", (req, res) => {
    const { id } = req.params;
    const task = TaskQueue.searchTaskById(Number(id));

    if (!task) {
      res.status(404).json({ message: "Task not found." });
    }

    res.json(task);
  });

  app.post("/increase-concurrency", async (req, res) => {
    try {
      const currentLimit = rabbitMQ.getConcurrencyLimit();
      rabbitMQ.setConcurrencyLimit(currentLimit + 1);
      logger.info(
        `#### Concurrency limit increased to ${
          currentLimit + 1
        } and boradcast to all workers ####`
      );
      rabbitMQ.broadcastGlobalMessage({
        type: "UPDATE_CONCURRENCY_LIMIT",
        data: currentLimit + 1,
      });
      res.send({ newLimit: rabbitMQ.getConcurrencyLimit() });
    } catch (e) {
      res.status(400).json({
        message: e.message,
        status: 400,
      });
    }
  });

  app.delete("/remove-task/:id", (req, res) => {
    const taskId = req.params.id;

    const taskRemoved = TaskQueue.removeTaskById(parseInt(taskId));

    if (taskRemoved) {
      res.status(200).json({ message: "Task removed successfully." });
    } else {
      res
        .status(400)
        .json({ message: "Task not found or could not be removed." });
    }
  });

  app.post("/decrease-concurrency", async (req, res) => {
    try {
      const currentLimit = rabbitMQ.getConcurrencyLimit();
      rabbitMQ.setConcurrencyLimit(currentLimit - 1);
      logger.info(
        `#### Concurrency limit decreased to ${
          currentLimit - 1
        } and boradcast to all workers ####`
      );

      rabbitMQ.broadcastGlobalMessage({
        type: "UPDATE_CONCURRENCY_LIMIT",
        data: currentLimit + 1,
      });

      res.send({ newLimit: rabbitMQ.getConcurrencyLimit() });
    } catch (e) {
      res.status(400).json({
        message: e.message,
        status: 400,
      });
    }
  });

  app.get("/cluster", monitorAuthMiddleware, (req, res) => {
    res.render("cluster");
  });

  app.get("/workers", (req, res) => {
    try {
      res.json(clusterOptions.getWorkers());
    } catch (e) {
      res.status(400).json({
        message: e.message,
        status: 400,
      });
    }
  });

  app.post("/workers", (req, res) => {
    try {
      const worker = clusterOptions.addWorker();
      res.json(worker);
    } catch (e) {
      res.status(400).json({
        message: e.message,
        status: 400,
      });
    }
  });

  app.delete("/workers/:id", (req, res) => {
    try {
      const { id } = req.params;
      const success = clusterOptions.stopWorker(id);
      if (success) {
        res.status(200).send(`Worker ${id} stopped.`);
      } else {
        res.status(404).send(`Worker ${id} not found.`);
      }
    } catch (e) {
      res.status(400).json({
        message: e.message,
        status: 400,
      });
    }
  });

  await rabbitMQ.connect();
  await rabbitMQ.initiateQueues();
  await rabbitMQ.setupGlobalMessaging();
  await TaskQueue.initialize();

  app.listen(port, () => {
    return logger.info(
      `#### Conversion Service Load Balancer ( MAIN ) is listening at ${ENV.LOAD_BALANCER_URL} ####`
    );
  });
};
