import { IDBPDatabase, openDB } from "idb";
import { JobTrackerDB, Job } from "./interfaces";

const DB_NAME = "job-tracker";
const DB_VERSION = 1;
const STORE_NAME = "jobs";

let dbPromise: Promise<IDBPDatabase<JobTrackerDB>> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB<JobTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
};

export const addJob = async (job: Omit<Job, "id" | "dateApplied">) => {
  const db = await getDb();
  const now = new Date().toISOString();

  const to_add: Job = {
    ...job,
    dateApplied: now,
  }

  const id = await db.add(STORE_NAME, to_add);
  return id;
};

