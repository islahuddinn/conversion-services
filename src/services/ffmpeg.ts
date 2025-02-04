
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { logger } from "./logger";
import path from "path";
import { getFileProperties } from "./file";
import { uploadFileToS3 } from "./AWS";
import pLimit from "@esm2cjs/p-limit";
import { ENV } from "../constants/environments";
import { ProcessingTaskResultType, TaskType } from "./TaskQueue";
import { errorMessageBuilder, proccessMessageBuilder } from "./messages";
import { PostItemType } from "../type/entities";

// Function to upload all TS files to S3

export async function uploadAllTSFilesToS3(url, task) {
  try {
    const { mediaDirectoryPath, regex } = getFileProperties(url);

    logger.info(
      proccessMessageBuilder({ task, message: "Uploading all TS files to S3" })
    );

    const files = fs.readdirSync(mediaDirectoryPath);
    // console.log(files, "here are the files =========1122")
    const limit = pLimit(parseInt(ENV.CONCURRENT_UPLOADING_PER_TASK) || 5);
    const uploadPromises = files
      .filter((file) => Object.values(regex).some((r) => r.test(file)))
      .map((file) =>
        limit(async () => {
          const filePath = path.join(mediaDirectoryPath, file);

          // console.log("Here is the uploading file path...............", filePath)
          const s3Key = `converted/${file}`;
          try {
            const url = await uploadFileToS3(filePath, s3Key, task);
            logger.info(
              proccessMessageBuilder({
                task,
                message: `Uploaded file ${file} to S3 at ${url}`,
              })
            );
          } catch (err) {
            logger.error(
              errorMessageBuilder({
                error: err,
                task,
                message: `Failed to upload file ${file} to S3`,
              })
            );
            throw err;
          }
        })
      );

    await Promise.all(uploadPromises);
    logger.info(
      proccessMessageBuilder({
        task,
        message: "All TS files uploaded successfully",
      })
    );
  } catch (error) {
    logger.error(
      errorMessageBuilder({
        error,
        task,
        message: "Error uploading TS files to S3",
      })
    );
    throw error;
  }
}


// //======== Function to generate HLS

function calculateBitrate(height: number): string {
  logger.info(`Starting bitrate calculation for height: ${height}`);
  try {
    let bitrate: string;
    if (height >= 1080) {
      bitrate = "5000k";
    } else if (height >= 720) {
      bitrate = "2500k";
    } else if (height >= 540) {
      bitrate = "1500k";
    } else if (height >= 480) {
      bitrate = "1200k";
    } else if (height >= 360) {
      bitrate = "800k";
    } else {
      bitrate = "400k";
    }
    logger.info(
      `Calculated bitrate: ${bitrate} for resolution height: ${height}`
    );
    return bitrate;
  } catch (error) {
    logger.error(`Error during bitrate calculation: ${error.message}`);
    throw error;
  }
}

async function detectVideoResolution(
  mediaPath: string
): Promise<{ width: number; height: number }> {
  logger.info(`Starting video resolution detection for file: ${mediaPath}`);
  return new Promise((resolve, reject) => {
    try {
      ffmpeg.ffprobe(mediaPath, (err, metadata) => {
        if (err) {
          logger.error(
            `Failed to execute ffprobe on file: ${mediaPath}. Error: ${err.message}`
          );
          reject(
            new Error(`Failed to detect video resolution: ${err.message}`)
          );
        } else {
          logger.info(`ffprobe successfully executed for file: ${mediaPath}`);
          const videoStream = metadata.streams.find(
            (stream) => stream.codec_type === "video"
          );

          if (!videoStream) {
            logger.error(`No video stream found in file: ${mediaPath}`);
            reject(new Error("No video stream found in the provided file."));
          } else {
            const { width, height } = videoStream;
            if (!width || !height) {
              logger.error(
                `Resolution data is missing in the video stream for file: ${mediaPath}`
              );
              reject(
                new Error("Unable to detect resolution from video metadata.")
              );
            } else {
              logger.info(
                `Detected video resolution: ${width}x${height} for file: ${mediaPath}`
              );
              resolve({ width, height });
            }
          }
        }
      });
    } catch (error) {
      logger.error(
        `Unexpected error during video resolution detection: ${error.message}`
      );
      reject(error);
    }
  });
}

// export async function generateHLS(
//   url: string,
//   task: TaskType
// ): Promise<string> {
//   const { mediaPath, m3u8, ts, mediaDirectoryPath } = getFileProperties(url);

//   logger.info(`Starting video resolution detection for ${mediaPath}`);
//   const { height } = await detectVideoResolution(mediaPath);

//   logger.info(`Calculating bitrate for resolution height: ${height}`);
//   const bitrate = calculateBitrate(height);

//   if (!fs.existsSync(mediaDirectoryPath)) {
//     fs.mkdirSync(mediaDirectoryPath, { recursive: true });
//     logger.info(`Created media directory: ${mediaDirectoryPath}`);
//   }

//   const outputTs = ts[height] || ts[720];
//   const outputM3u8 = m3u8[height] || m3u8[720]; 
//   logger.info(
//     `Starting HLS generation for ${mediaPath} with resolution: ${height}p`
//   );

//   try {
//     await new Promise<void>((resolve, reject) => {
//       ffmpeg(mediaPath)
//         .videoCodec("libx264")
//         .size(`?x${height}`)
//         .outputOptions("-f hls")
//         .outputOptions("-hls_time 10")
//         .outputOptions("-hls_playlist_type vod")
//         .outputOptions(`-b:v ${bitrate}`)
//         .outputOptions(`-hls_segment_filename ${outputTs}`)
//         .output(outputM3u8)
//         .on("start", () => {
//           logger.info(`Started HLS generation for resolution: ${height}p`);
//         })
//         .on("progress", (progress) => {
//           logger.info(
//             `Progress: ${progress.percent?.toFixed(
//               2
//             )}% for resolution: ${height}p`
//           );
//         })
//         .on("end", () => {
//           logger.info(`Completed HLS generation for resolution: ${height}p`);
//           resolve();
//         })
//         .on("error", (error) => {
//           logger.error(`Error during HLS generation: ${error.message}`);
//           reject(new Error(`HLS generation failed: ${error.message}`));
//         })
//         .run();
//     });

//     logger.info("Uploading generated HLS files to S3...");
//     await uploadAllTSFilesToS3(url, task);
//     logger.info("Creating master playlist...");
//     const masterPlaylistUrl = await createMasterPlaylist(url, task);

//     logger.info("Cleaning up temporary files...");
//     await cleanUpFiles(url, task);

//     return masterPlaylistUrl;
//   } catch (error) {
//     logger.error(`HLS generation failed: ${error.message}`);
//     await cleanUpFiles(url, task);
//     throw error;
//   }
// }



export async function generateHLS(
  url: string,
  task: TaskType
): Promise<string> {
  const { mediaPath, m3u8, ts, mediaDirectoryPath } = getFileProperties(url);

  let height: number;

  const resolutionItem = task.PostItems.find(
    (item) => item.resolution && !isNaN(parseInt(item.resolution, 10))
  );

  if (resolutionItem) {
    const userResolution = parseInt(resolutionItem.resolution, 10); 
    logger.info(`User-specified resolution: ${userResolution}p`);
    height = userResolution;
  } else {
    logger.info(
      `No resolution provided in PostItems. Detecting video resolution for ${mediaPath}.`
    );
    const detectedResolution = await detectVideoResolution(mediaPath);
    height = detectedResolution.height;
  }

  logger.info(`Using resolution height: ${height}p`);

  const bitrate = calculateBitrate(height);

  if (!fs.existsSync(mediaDirectoryPath)) {
    fs.mkdirSync(mediaDirectoryPath, { recursive: true });
    logger.info(`Created media directory: ${mediaDirectoryPath}`);
  }

  const outputTs = ts[height] || ts[720]; 
  const outputM3u8 = m3u8[height] || m3u8[720];
  logger.info(
    `Starting HLS generation for ${mediaPath} with resolution: ${height}p`
  );

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(mediaPath)
        .videoCodec("libx264")
        .size(`?x${height}`) 
        .outputOptions("-f hls")
        .outputOptions("-hls_time 10")
        .outputOptions("-hls_playlist_type vod")
        .outputOptions(`-b:v ${bitrate}`) 
        .outputOptions(`-hls_segment_filename ${outputTs}`) 
        .output(outputM3u8) 
        .on("start", () => {
          logger.info(`Started HLS generation for resolution: ${height}p`);
        })
        .on("progress", (progress) => {
          logger.info(
            `Progress: ${progress.percent?.toFixed(
              2
            )}% for resolution: ${height}p`
          );
        })
        .on("end", () => {
          logger.info(`Completed HLS generation for resolution: ${height}p`);
          resolve();
        })
        .on("error", (error) => {
          logger.error(`Error during HLS generation: ${error.message}`);
          reject(new Error(`HLS generation failed: ${error.message}`));
        })
        .run();
    });

    logger.info("Uploading generated HLS files to S3...");
    await uploadAllTSFilesToS3(url, task);
    logger.info("Creating master playlist...");
    const masterPlaylistUrl = await createMasterPlaylist(url, task);

    logger.info("Cleaning up temporary files...");
    await cleanUpFiles(url, task);

    return masterPlaylistUrl;
  } catch (error) {
    logger.error(`HLS generation failed: ${error.message}`);
    await cleanUpFiles(url, task);
    throw error;
  }
}



////Function to create master playlist (m3u8 file)

async function createMasterPlaylist(
  url: string,
  task: TaskType
): Promise<string> {
  const { m3u8, finalPlayListFilePath, fileNameWithoutFormatAsFolderName } =
    getFileProperties(url);

  logger.info("Uploading individual resolution playlists to S3...");

  const resolutions = [
    { height: 480, bandwidth: 856000, resolution: "854x480" },
    { height: 540, bandwidth: 1280000, resolution: "960x540" },
    { height: 720, bandwidth: 2675000, resolution: "1280x720" },
  ];

  try {
    const uploadedUrls = await Promise.all(
      resolutions.map(async ({ height }) => {
        const playlistPath = m3u8[height];
        if (!fs.existsSync(playlistPath)) {
          logger.warn(
            `Playlist file does not exist for resolution: ${height}p`
          );
          return null; 
        }
        const s3Path = `converted/${fileNameWithoutFormatAsFolderName}_${height}p.m3u8`;
        return uploadFileToS3(playlistPath, s3Path, task);
      })
    );

    const masterPlaylistContent = `
#EXTM3U
${resolutions
  .map(({ height, bandwidth, resolution }, index) => {
    const url = uploadedUrls[index];
    if (!url) return ""; 
    return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${url}`;
  })
  .join("\n")}
    `.trim();

    if (!masterPlaylistContent.includes("#EXT-X-STREAM-INF")) {
      throw new Error(
        "No valid resolution playlists available for the master playlist."
      );
    }

    logger.info("Writing master playlist file...");
    await fs.promises.writeFile(finalPlayListFilePath, masterPlaylistContent);
    logger.info(
      `Master playlist created successfully: ${finalPlayListFilePath}`
    );

    return finalPlayListFilePath;
  } catch (error) {
    logger.error(`Error during master playlist creation: ${error.message}`);
    throw error;
  }
}

function deleteFile(filePath: string) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error) {
        const errorMessage = errorMessageBuilder({
          error,
          message: "Error deleting file:",
        });
        logger.error(errorMessage);
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

async function cleanUpFiles(url: string, task: TaskType) {
  try {
    const {
      mediaDirectoryPath,
      fileNameWithoutFormatAsFolderName,
      fileFormat,
    } = getFileProperties(url);
    const patterns = [
      new RegExp(`^${fileNameWithoutFormatAsFolderName}_720p\.m3u8$`),
      new RegExp(`^${fileNameWithoutFormatAsFolderName}_720p_\d+\.ts$`),
      new RegExp(`^${fileNameWithoutFormatAsFolderName}_540p\.m3u8$`),
      new RegExp(`^${fileNameWithoutFormatAsFolderName}_540p_\d+\.ts$`),
      new RegExp(`^${fileNameWithoutFormatAsFolderName}_480p\.m3u8$`),
      new RegExp(`^${fileNameWithoutFormatAsFolderName}_480p_\d+\.ts$`),
      new RegExp(`^${fileNameWithoutFormatAsFolderName}\.${fileFormat}$`),
    ];

    const files = fs.readdirSync(mediaDirectoryPath);

    for (const pattern of patterns) {
      for (const file of files) {
        if (pattern.test(file)) {
          await deleteFile(path.join(mediaDirectoryPath, file));
        }
      }
    }

    logger.info(
      proccessMessageBuilder({
        task,
        message: "All temporary files cleaned up successfully." + url,
      })
    );
  } catch (error) {
    const errorMessage = errorMessageBuilder({
      error,
      message: "Error during cleanup:",
    });
    logger.error(errorMessage);
    throw error;
  }
}
export const convertOptions = {
  generateHLS,
};
