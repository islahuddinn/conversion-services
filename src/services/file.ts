import path, { format } from "path";
import fs from "fs";

const storagePath = path.join(__dirname, "../storage");

if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

export const getFileProperties = (url: string) => {
  const fileNameWithFormat = url.substring(url.lastIndexOf("/") + 1);

  const fileNameWithoutFormatAsFolderName = `${fileNameWithFormat.replace(
    path.extname(fileNameWithFormat),
    ""
  )}`;

  const mediaDirectoryPath = path.join(
    storagePath,
    fileNameWithoutFormatAsFolderName
  );
  if (!fs.existsSync(mediaDirectoryPath)) {
    fs.mkdirSync(mediaDirectoryPath, { recursive: true });
  }
  const mediaPath = path.join(mediaDirectoryPath, fileNameWithFormat);
  const fileFormat = path.extname(fileNameWithFormat).substring(1);

  return {
    fileNameWithFormat,
    fileNameWithoutFormatAsFolderName,
    mediaPath,
    storagePath,
    fileFormat,
    mediaDirectoryPath,
    // webm: path.join(
    //   mediaDirectoryPath,
    //   `${fileNameWithoutFormatAsFolderName}_compressed.webm`
    // ),
    m3u8: {
      720: path.join(
        mediaDirectoryPath,
        `${fileNameWithoutFormatAsFolderName}_720p.m3u8`
      ),
      480: path.join(
        mediaDirectoryPath,
        `${fileNameWithoutFormatAsFolderName}_480p.m3u8`
      ),
      360: path.join(
        mediaDirectoryPath,
        `${fileNameWithoutFormatAsFolderName}_360p.m3u8`
      ),
    },
    ts: {
      720: path.join(
        mediaDirectoryPath,
        `${fileNameWithoutFormatAsFolderName}_720p_%03d.ts`
      ),
      480: path.join(
        mediaDirectoryPath,
        `${fileNameWithoutFormatAsFolderName}_480p_%03d.ts`
      ),
      360: path.join(
        mediaDirectoryPath,
        `${fileNameWithoutFormatAsFolderName}_360p_%03d.ts`
      ),
    },
    regex: {
      720: /^.*_720p_\d+\.ts$/,
      480: /^.*_480p_\d+\.ts$/,
      360: /^.*_360p_\d+\.ts$/,
    },

    finalPlayListFilePath: path.join(
      mediaDirectoryPath,
      `${fileNameWithoutFormatAsFolderName}.m3u8`
    ),
  };
};

export const removeFolder = (folderPath: string) => {
  fs.rmdirSync(folderPath, { recursive: true });
};
