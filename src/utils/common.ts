import fs from "fs";

export function parseUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol;
    const host = parsedUrl.hostname;
    const port = parsedUrl.port || (protocol === "https:" ? "443" : "80");

    const hostWithoutPort = `${protocol}//${host}`;
    const hostWithPort =
      (port === "80" && protocol === "http:") ||
      (port === "443" && protocol === "https:")
        ? host
        : `${host}:${port}`;

    return {
      hostWithProtocol: `${protocol}//${hostWithPort}`,
      hostWithoutPort,
      port,
      host,
    };
  } catch (error) {
    throw new Error(`Invalid URL provided: ${url}`);
  }
}

export async function validateFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error("File does not exist");
  }

  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    throw new Error("Downloaded file is empty");
  }
}
