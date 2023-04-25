import {User, Retweet} from "@prisma/client";
import {type PostWithUser} from "@/models/post";
import {databaseManager} from "@/db/index";

type UserProfileData = Partial<Pick<User, "name" | "email" | "imageName">>;
type UserData = Pick<User, "name" | "email" | "password">;

export type UserWithoutPassword = Omit<User, "password">;

export const selectUserColumnsWithoutPassword = {
  id: true,
  name: true,
  email: true,
  imageName: true,
  createdAt: true,
  updatedAt: true,
};

export const createUser = async (userData: UserData): Promise<User> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.create({
    data: {...userData, imageName: "/image/users/default_user.jpg"},
  });
  return user;
};

export const updateUserProfile = async (
  userId: number,
  userProfileData: UserProfileData
): Promise<User> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: userProfileData,
  });
  return user;
};

export const getUserWithPosts = async (
  userId: number
): Promise<
  | (UserWithoutPassword & {
      posts: PostWithUser[];
    })
  | null
> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
      posts: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          content: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              ...selectUserColumnsWithoutPassword,
            },
          },
        },
      },
    },
  });
  if (user === null) return null;
  return user;
};

export const getUserLikedPosts = async (
  userId: number
): Promise<
  | (UserWithoutPassword & {
      likes: Array<{
        post: PostWithUser;
      }>;
    })
  | null
> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
      likes: {
        orderBy: {
          post: {
            createdAt: "desc",
          },
        },
        select: {
          post: {
            select: {
              id: true,
              content: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
              user: {
                select: {
                  ...selectUserColumnsWithoutPassword,
                },
              },
            },
          },
        },
      },
    },
  });
  if (user === null) return null;
  return user;
};

// 追加
type UserWithRetweets = {
  id: number;
  email: string;
  name: string;
  imageName: string;
  createdAt: Date;
  updatedAt: Date;
  retweets: Array<Retweet & {post: PostWithUser}>;
  posts: Array<PostWithUser & {retweeted?: boolean; retweetedBy?: string}>;
} | null;
// 指定されたユーザーがリツイートした投稿を含めたユーザー情報を返す関数
export const getUserWithRetweets = async (
  userId: number
): Promise<UserWithRetweets> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {id: userId},
    include: {
      retweets: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          post: {
            include: {
              user: true,
            },
          },
        },
      },
      posts: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!user) return null;
  // ユーザーがリツイートした投稿と、投稿した投稿を重複させたものを作成する
  const retweetsWithLabel = user.retweets.map(retweet => ({
    ...retweet.post,
    retweetedBy: retweet.post.user.name,
    createdAt: retweet.createdAt,
    retweeted: true,
  }));
  const postsWithLabel = user.posts.map(post => ({
    ...post,
    retweeted: false,
  }));
  const posts = [...retweetsWithLabel, ...postsWithLabel];

  // リツイートされた投稿はリツイート日時の順番で表示するようにソートする
  const sortedPosts = posts.sort((a, b) =>
    a.retweeted && b.retweeted
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : a.createdAt > b.createdAt
      ? -1
      : 1
  );

  return {
    ...user,
    posts: sortedPosts,
  };
};

export const getAllUsers = async (): Promise<UserWithoutPassword[]> => {
  const prisma = databaseManager.getInstance();
  const users = await prisma.user.findMany({
    select: {
      ...selectUserColumnsWithoutPassword,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return users;
};

export const getUser = async (
  userId: number
): Promise<UserWithoutPassword | null> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
    },
  });
  return user;
};

export const getUserByEmail = async (
  email: string
): Promise<UserWithoutPassword | null> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
    },
  });
  return user;
};

export const getUserByEmailWithPassword = async (
  email: string
): Promise<User | null> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};
