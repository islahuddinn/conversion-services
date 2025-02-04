import fs from "fs";
import { logger } from "./logger";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "../constants/environments";
import { getFileProperties } from "./file";
import axios from "axios";
import { validateFile } from "../utils/common";
import { TaskType } from "./TaskQueue";
import { errorMessageBuilder, proccessMessageBuilder } from "./messages";

const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY,
    secretAccessKey: ENV.AWS_SECRET_KEY,
  },
});
const bucketName = ENV.AWS_BUCKET_NAME;

// export async function uploadFileToS3(
//   filePath: string,
//   key: string,
//   task: TaskType
// ): Promise<any> {
//   try {
//     logger.info(
//       proccessMessageBuilder({
//         task,
//         message: `Uploading file ${filePath} to S3`,
//       })
//     );
//     const fileContent = fs.readFileSync(filePath);
//     const params = {
//       Bucket: bucketName,
//       Key: key,
//       Body: fileContent,
//     };
//     const command = new PutObjectCommand(params);
//     await s3Client.send(command);

//     const publicUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;

//     return publicUrl;
//   } catch (error) {
//     const errorMessage = errorMessageBuilder({
//       message: `${ENV.AWS_ACCESS_KEY}Error ... uploading file for ${filePath}`,
//       task,
//       error,
//     });
//     logger.info(errorMessage);

//     throw new Error(errorMessage);
//   }
// }


export async function uploadFileToS3(filePath, key, task) {
  try {
    logger.info(
      proccessMessageBuilder({
        task,
        message: `Uploading file ${filePath} to S3`,
      })
    );

    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
    };
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const publicUrl = `https://${bucketName}.s3.amazonaws.com/${key}`;

    logger.info(
      proccessMessageBuilder({
        task,
        message: `File ${filePath} uploaded to S3 at ${publicUrl}`,
      })
    );
    return publicUrl;
  } catch (error) {
    const errorMessage = errorMessageBuilder({
      message: `Error uploading file ${filePath} to S3`,
      task,
      error,
    });
    logger.error(errorMessage);
    throw error;
  }
}


export async function downloadFileFromS3(
  url: string,
  task: TaskType,
  maxRetries = parseInt(ENV.S3_RETRY_COUNT_FOR_DOWNLOADING) || 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      logger.info(
        proccessMessageBuilder({
          task,
          message: `Downloading file ${url} from S3`,
        })
      );

      await S3Downloader(url, task);
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        const errorMessage = errorMessageBuilder({
          message: `Failed to download file after retries after ${maxRetries} retries`,
          task,
          error,
        });
        logger.info(errorMessage);

        throw new Error(errorMessage);
      }
    }
  }
}

export function S3Downloader(url: string, task: TaskType): Promise<string> {
  try {
    const { mediaPath } = getFileProperties(url);

    logger.info(
      proccessMessageBuilder({
        message: `start downloading file ${url}`,
        task,
      })
    );

    return new Promise((resolve, reject) => {
      axios({
        method: "get",
        url: url,
        responseType: "stream",
        timeout: 10000,
      })
        .then((response) => {
          const file = fs.createWriteStream(mediaPath);
          response.data.pipe(file);

          file.on("finish", async () => {
            file.close(() => {
              logger.info(`finish downloading file ${url}`);
              validateFile(mediaPath)
                .then(() => {
                  resolve(mediaPath);
                })
                .catch((error) => {
                  reject(error);
                });
            });
          });
        })
        .catch((error) => {
          const errorMessage = errorMessageBuilder({
            message: `Error downloading file ${url}`,
            task,
            error,
          });
          logger.info(errorMessage);

          reject(error);
        });
    });
  } catch (error) {
    const errorMessage = errorMessageBuilder({
      message: `Error downloading file ${url}`,
      task,
      error,
    });
    logger.info(errorMessage);

    throw new Error(errorMessage);
  }
}
