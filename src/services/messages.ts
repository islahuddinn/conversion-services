import { PostItemType } from "../type/entities";
import { TaskType } from "./TaskQueue";

export const errorMessageBuilder = ({
  error,
  task,
  postItem,
  message,
}: {
  error: Error;
  task?: TaskType;
  postItem?: PostItemType;
  message?: string;
}) => {
  return `error : ${error.message}${task.id ? `, taskID : ${task.id}` : ``}${
    task.refID ? `, refID : ${task.refID}` : ``
  }${postItem?.Content ? `, url : ${postItem?.Content}` : ``}${
    message ? `, message : ${message}` : ``
  }`;
};

export const proccessMessageBuilder = ({
  task,
  postItem,
  message,
}: {
  task?: TaskType;
  postItem?: PostItemType;
  message: string;
}) => {
  return `message : ${message}${task?.id ? `, taskID : ${task?.id}` : ``}${
    task?.refID ? `, refID : ${task?.refID}` : ``
  }${postItem?.Content ? `, url : ${postItem?.Content}` : ``}`;
};
