import { DBSchema } from "idb";

export type JobStatus = "applied" | "interviewing" | "offered" | "rejected";

export interface JobTrackerDB extends DBSchema {
  jobs: {
    key: number;
    value: Job;
    // indexes: {
    //   byStatus: JobStatus;
    //   byCompany: string;
    //   byCreatedAt: string;
    // };
  };
}

export interface Job {
    id?: number;
    title: string;
    company: string;
    location: string;
    description: string;
    link: string;
    dateApplied: string;
    status: JobStatus;
};

