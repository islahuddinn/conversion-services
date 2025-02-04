import { logger } from "../services/logger";
import { PostItemType } from "../type/entities";

export const detectTypeOfAttachment = (postItem: PostItemType) => {
  return postItem.PostItemType === 1 ? "IMAGE" : "VIDEO";
};

export const extractAttachmentsFromPost = (
  PostItems: string
): PostItemType[] => {
  try {
    const ParsedPostItems: PostItemType[] = JSON.parse(PostItems);
    if (ParsedPostItems.length === 0) {
      throw new Error("Invalid PostItems ( empty length )");
    }
    return ParsedPostItems;
  } catch (e) {
    logger.error("Error in extractAttachmentsFromPost: " + e.message);
    throw new Error("Invalid PostItems ( unable to parse )");
  }
};
