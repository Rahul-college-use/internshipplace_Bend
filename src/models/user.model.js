import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      unique: true,
    },
    // Personal Information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
    },
    emailAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Academic Information
    universityId: {
      type: String,
      required: true,
    },
    collegeId: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    session: {
      type: String,
      required: true,
    },
    universityRoll: {
      type: String,
      required: true,
      unique: true,
    },
    universityReg: {
      type: String,
      required: true,
      unique: true,
    },

    isEnrolled: {
      type: Boolean,
      default: false
    },

    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "courses"
      }
    ],
    // Emergency Contact
    emergencyName: {
      type: String,
      required: true,
    },
    emergencyPhone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    relationship: {
      type: String,
      enum: ["Father", "Mother", "Guardian", "Sibling"],
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
  // Login Authentication
  password: {
  type: String,
  required: true,
  minlength: 8,
},

  // Trackers
  isVerified: {
  type: Boolean,
  default: false,
},
  registrationStatus: {
  type: String,
  enum: ["Pending", "Approved", "Rejected"],
  default: "Pending",
},
  lastLogin: Date,
  },
{
  timestamps: true, // Automatically manages createdAt and updatedAt properties
  }
);

// Check if model already initialized to prevent compilation errors during hot-reloading
const userModel = mongoose.models.users || mongoose.model("users", userSchema);

export default userModel;