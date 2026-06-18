import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    date: {
      type: String, // Stored as "YYYY-MM-DD" for simple daily string matching
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day"],
      default: "Present",
    },
    clockIn: { type: String, default: "--:--" },
    clockOut: { type: String, default: "--:--" },
    remarks: { type: String, default: "Regular Session" },
  },
  { timestamps: true }
);

// Optimize queries searching logs by student index paths
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const attendanceModel = mongoose.models.attendance || mongoose.model("attendance", attendanceSchema);
export default attendanceModel;