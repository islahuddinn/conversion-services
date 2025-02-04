import sharp from "sharp";
import { PostItemType } from "../type/entities";
import { downloadFileFromS3, uploadFileToS3 } from "./AWS";
import { convertOptions, generateHLS } from "./ffmpeg";
import { getFileProperties , removeFolder} from "./file";
import { logger } from "./logger";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { TaskType } from "./TaskQueue";
import { detectTypeOfAttachment } from "../utils/post";
import pLimit from "@esm2cjs/p-limit";
import fs from "fs";
import sizeOf from "image-size";
import { errorMessageBuilder, proccessMessageBuilder } from "./messages";

// Starting the conversation and processing attachments
export const startConversation = async (
  task: TaskType
): Promise<
  Array<{
    postItem: PostItemType;
    results: string[];
  }>
> => {
  const attachments = task.PostItems;

  logger.info(
    proccessMessageBuilder({
      message: `Starting conversation with ${attachments.length} attachments`,
      task,
    })
  );

  const results = [];
  for (const attachment of attachments) {
    const attachmentType = detectTypeOfAttachment(attachment);
    if (attachmentType === "VIDEO") {
      const urls = await convertVideo(attachment, task.id, task);
      results.push({ postItem: attachment, results: urls });
    }
    if (attachmentType === "IMAGE") {
      const urls = await convertImage(attachment, task.id, task);
      results.push({ postItem: attachment, results: urls });
    }
  }
  return results;
};

// Image conversion logic (resizing and format conversion)
async function convertImage(
  attachment: PostItemType,
  id: number,
  task: TaskType
) {
  try {
    logger.info(
      proccessMessageBuilder({
        message: `Starting conversion for Image ${attachment.Content}`,
        task,
      })
    );
    const { mediaPath, fileNameWithoutFormatAsFolderName, mediaDirectoryPath } =
      getFileProperties(attachment.Content);

    await downloadFileFromS3(attachment.Content, task);

    const metadata = await sharp(mediaPath).metadata();
    if (!metadata || metadata.size === 0) {
      throw new Error("Invalid or corrupted image");
    }
    const limit = pLimit(4);
    sharp.cache({ files: 0 });
    sharp.concurrency(4);
    const versions = [
      { width: 1920, quality: 80, suffix: "large" },
      { width: 1280, quality: 70, suffix: "medium" },
      { width: 640, quality: 60, suffix: "small" },
      { width: 320, quality: 50, suffix: "extra-small" },
    ];

    const resizePromises = versions.map((version) =>
      limit(async () => {
        const outputName = `${fileNameWithoutFormatAsFolderName}_${version.suffix}.webp`;
        const outputFilePath = path.join(mediaDirectoryPath, outputName);

        logger.info(`Processing version: ${version.suffix}`);
        await sharp(mediaPath)
          .resize(version.width)
          .webp({ quality: version.quality })
          .toFile(outputFilePath);
        const dimensions = sizeOf(outputFilePath);
        const fileSize = fs.statSync(outputFilePath).size;

        const URL = await uploadFileToS3(
          outputFilePath,
          `converted/${uuidv4()}/${outputName}`,
          task
        );

        return {
          URL,
          metadata: {
            width: dimensions.width,
            height: dimensions.height,
            format: dimensions.type,
            size: fileSize,
          },
        };
      })
    );

    const urls = await Promise.all(resizePromises);

    logger.info(
      proccessMessageBuilder({
        message: `FINAL RESULT IMAGE : ${urls}`,
        task,
      })
    );

    removeFolder(mediaDirectoryPath);
    return urls;
  } catch (error) {
    const { mediaDirectoryPath } = getFileProperties(attachment.Content);
    removeFolder(mediaDirectoryPath);

    const errorMessage = errorMessageBuilder({
      message: `Cleaning up image directory for task ${id} because of error`,
      task,
      error,
    });
    logger.info(errorMessage);

    throw new Error(errorMessage);
  }
}


export const convertVideo = async (attachment, id, task) => {
  logger.info(
    proccessMessageBuilder({
      message: `Starting conversion for video ${attachment.Content}`,
      task,
    })
  );

  try {
    await downloadFileFromS3(attachment.Content, task);

    const { finalPlayListFilePath, mediaPath, mediaDirectoryPath } =
      getFileProperties(attachment.Content);
    logger.debug(
      `File properties: ${JSON.stringify({
        finalPlayListFilePath,
        mediaPath,
        mediaDirectoryPath,
      })}`
    );

    const generatedFile = await generateHLS(attachment.Content, task);
    logger.debug(`Generated HLS file: ${generatedFile}`);

    const finalURL = await uploadFileToS3(
      finalPlayListFilePath,
      `converted/${uuidv4()}/${id}.m3u8`,
      task
    );

    removeFolder(mediaDirectoryPath);

    logger.info(
      proccessMessageBuilder({
        message: `FINAL RESULT VIDEO : ${finalURL}`,
        task,
      })
    );

    const thumNailImageURLs = await convertImage(
      {
        Content: attachment.ThumNail,
        Order: 0,
        ThumNail: "",
        PostItemType: 1,
        Width: 0,
        Height: 0,
        resolution: ""
      },
      task.id,
      task
    );

    return {
      video: finalURL,
      thumbnail: thumNailImageURLs,
    };
  } catch (error) {
    const { mediaDirectoryPath } = getFileProperties(attachment.Content);
    removeFolder(mediaDirectoryPath);

    const errorMessage = errorMessageBuilder({
      message: `Cleaning up video directory for task ${id} because of error`,
      task,
      error,
    });
    logger.error(errorMessage);
    throw error;
  }
};