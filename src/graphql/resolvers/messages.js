const { AuthenticationError, PubSub, withFilter } = require("apollo-server");
const Message = require("../../models/Message");
const getAuthenticatedUser = require("../middlewares/authenticated");

const pubsub = new PubSub();

module.exports = {
  Query: {
    getMessages: async (_, __, context) => {
      const { user: authUser } = await getAuthenticatedUser({ context });

      if (!authUser) {
        throw new AuthenticationError("Unauthenticated!");
      }

      const messages = await Message.find({
        notifier: authUser.id,
      })
        .populate("creator", "firstName lastName avatarImage")
        .populate("notifier", "firstName lastName avatarImage");

      return messages;
    },
  },
  Mutation: {
    createMessage: async (_, { notifier, body }, context) => {
      const { user: authUser } = await getAuthenticatedUser({ context });

      if (!authUser) {
        throw new AuthenticationError("Unauthenticated!");
      }

      const message = await Message({
        creator: authUser.id,
        notifier,
        body,
      })
        .save()
        .then(t =>
          t.populate("creator", "firstName lastName avatarImage").execPopulate()
        )
        .then(t =>
          t
            .populate("notifier", "firstName lastName avatarImage")
            .execPopulate()
        );

      pubsub.publish("newMessage", {
        newMessage: message,
        notifier,
      });

      return message;
    },
  },
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("newMessage"),
        (payload, variables) => {
          return payload.notifier === variables.notifier;
        }
      ),
    },
  },
};
