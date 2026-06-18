import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    courseStartDate: {
      type: Date,
      required: true,
    },
    courseEndDate: {
      type: Date,
      required: true,
    },
    cert: {
      type: String,
      enum: ['AICTE Compliant', 'UGC Compliant'],
      required: true
    },
    meta: {
      type: String,
      enum: ['All Specializations', 'B.Tech / Diploma','Computer Applications'],
      required: true

    }

  },

  {
    timestamps: true, // Automatically tracks createdAt and updatedAt database operations
  }
);

// Prevent model re-compilation overwrite errors during live server code updates
const courseModel = mongoose.models.courses || mongoose.model("courses", courseSchema);

export default courseModel;