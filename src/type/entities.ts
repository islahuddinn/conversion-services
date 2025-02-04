export enum FileType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export type IncomingConversionTaskType = {
  id: string;
  url: string;
  type: FileType;
};

export enum TaskStatusType {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  FAILED = "FAILED",
  COMPLETED = "COMPLETED",
}

export type PostItemType = {
  Order: number;
  ThumNail: string;
  Content: string;
  PostItemType: number;
  resolution: string;
  Width: number;
  Height: number;
};
