const {
  AuthenticationError,
  UserInputError,
  PubSub,
} = require("apollo-server");

const Post = require("../../models/Post");
const getAuthenticatedUser = require("../middlewares/authenticated");

const NEW_LIKE = "NEW_LIKE";

const pubsub = new PubSub();

module.exports = {
  Query: {
    getPosts: async (_, __, context) => {
      try {
        const { user } = getAuthenticatedUser(context);

        const posts = await Post.find({ author: user.id })
          .populate("author", "firstName lastName coverImage")
          .sort({
            creationDate: -1,
          });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    createPost: async (_, { body }, context) => {
      const { user } = getAuthenticatedUser(context);
      if (!user) {
        throw new Error("Unauthenticated!");
      }

      const newPost = new Post({
        body,
        author: user.id,
      });
      const post = await newPost
        .save()
        .then(t =>
          t.populate("author", "firstName lastName coverImage").execPopulate()
        );
      return post;
    },
    deletePost: async (_, { postId }, context) => {
      const { user } = getAuthenticatedUser(context);

      try {
        const post = await Post.findById(postId);

        if (user.id === post.author.userId.toString()) {
          await post.delete();
          return "Post deleted successfully";
        }
        throw new AuthenticationError("Action not allowed");
      } catch (err) {
        throw new Error(err);
      }
    },
    likePost: async (_, { postId }, context) => {
      const { user } = getAuthenticatedUser(context);
      const post = await Post.findById(postId);
      if (post) {
        if (post.likes.find(like => like.userId.toString() === user.id)) {
          // post was already liked
          post.likes = post.likes.filter(
            like => like.userId.toString() !== user.id
          );
        } else {
          // not liked post
          post.likes.push({
            userId: user.id,
          });
        }

        pubsub.publish(NEW_LIKE, {
          newLike: post.likes[post.likes.length - 1],
        });

        await post.save();
        return post;
      }
      throw new UserInputError("Post Not Found");
    },
  },
  Subscription: {
    newLike: {
      subscribe: () => pubsub.asyncIterator(NEW_LIKE),
    },
  },
};
