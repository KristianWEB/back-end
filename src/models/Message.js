const { model, Schema } = require("mongoose");

const MessageSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  notifier: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  body: {
    type: String,
    required: true,
  },
  createdAt: { type: Number, default: Date.now() },
});

const Message = model("Message", MessageSchema);

module.exports = Message;
