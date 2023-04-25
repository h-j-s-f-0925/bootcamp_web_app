import {Post} from "@prisma/client";
import {Retweet} from "@prisma/client";
import {databaseManager} from "@/db/index";
import {
  selectUserColumnsWithoutPassword,
  type UserWithoutPassword,
} from "@/models/user";

type PostData = Pick<Post, "content" | "userId">;
export type PostWithUser = Post & {user: UserWithoutPassword};

export const createPost = async (postData: PostData): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.create({
    data: postData,
  });
  return post;
};

export const updatePost = async (
  postId: number,
  content: string
): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      content,
    },
  });
  return post;
};

export const deletePost = async (postId: number): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.delete({
    where: {
      id: postId,
    },
  });
  return post;
};

export const getPost = async (postId: number): Promise<PostWithUser | null> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
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
  });
  return post;
};

export const getAllPosts = async (): Promise<PostWithUser[]> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.findMany({
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
  });
  return post;
};

// type PostWithRetweets = Post & { retweets: Retweet[] };
// export const getAllPostsWithRetweets = async (): Promise<PostWithRetweets[]> => {
//   const prisma = databaseManager.getInstance();
//   const posts = await prisma.post.findMany({
//     include: {
//       retweets: true,
//       user:true,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });
//   const postsWithRetweets: PostWithRetweets[] = posts.flatMap((post) => {
//     if (post.retweets.length === 0) {
//       return [post];
//     } else {
//       return [
//         post,
//         ...post.retweets.map((retweet) => ({
//           ...post,
//           retweets: [],
//           userId: retweet.userId,
//           createdAt: retweet.createdAt,
//         }))
//       ];
//     }
//   });
//   postsWithRetweets.sort((a, b) => {
//     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//   });
//   return postsWithRetweets;
// };

type PostWithRetweets = Post & {retweets: Retweet[]};

export const getAllPostsWithRetweets = async (): Promise<
  PostWithRetweets[]
> => {
  const prisma = databaseManager.getInstance();
  const posts = await prisma.post.findMany({
    include: {
      retweets: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const postsWithRetweets: PostWithRetweets[] = posts.flatMap(post => {
    if (post.retweets.length === 0) {
      return [post];
    } else {
      const retweets = post.retweets.map(retweet => ({
        ...post,
        retweets: [],
        userId: retweet.userId,
        createdAt: retweet.createdAt,
      }));
      return [...retweets, post];
    }
  });

  postsWithRetweets.sort((a, b) => {
    if (a.retweets.length > 0 && b.retweets.length > 0) {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else if (a.retweets.length > 0) {
      return -1;
    } else if (b.retweets.length > 0) {
      return 1;
    } else {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  return postsWithRetweets;
};
