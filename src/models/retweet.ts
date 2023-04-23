import {Retweet} from "@prisma/client";
import {databaseManager} from "@/db/index";

type RetweetData = Pick<Retweet, "userId" | "postId">;

export const getPostRetweetedCount = async (
  postId: number
): Promise<number> => {
  const prisma = databaseManager.getInstance();
  const count = await prisma.retweet.count({
    where: {
      postId,
    },
  });
  return count;
};

export const createRetweet = async (
  retweetData: RetweetData
): Promise<Retweet> => {
  const prisma = databaseManager.getInstance();
  const retweet = await prisma.retweet.create({
    data: retweetData,
  });
  return retweet;
};

export const deleteRetweet = async (
  retweetData: RetweetData
): Promise<Retweet> => {
  const prisma = databaseManager.getInstance();
  const retweet = await prisma.retweet.delete({
    where: {
      /* eslint-disable camelcase */
      userId_postId: {
        userId: retweetData.userId,
        postId: retweetData.postId,
      },
      /* eslint-enable camelcase */
    },
  });
  return retweet;
};

export const hasUserRetweetedPost = async (
  userId: number,
  postId: number
): Promise<boolean> => {
  const prisma = databaseManager.getInstance();
  const retweet = await prisma.retweet.findFirst({
    where: {
      userId,
      postId,
    },
  });
  return retweet !== null;
};
