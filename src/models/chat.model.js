import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courses",
      required: true,
    },
    user: {
      type: String, // Full Name of the student or instructor
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isInstructor: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const chatModel = mongoose.models.chats || mongoose.model("chats", chatSchema);
export default chatModel;