import Database from "better-sqlite3";
import path from "path";

export const db = new Database(path.join(__dirname, "taskQueue.db"), {});

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    postItems TEXT,
    status TEXT,
    updatedAt INTEGER,
    createdAt INTEGER,
    retryCount INTEGER,
    callbackDeliveryTryCount INTEGER,
    callbackUrl TEXT,
    results TEXT,
    error TEXT,
    refID TEXT,
    callBackError TEXT
  )
`);
