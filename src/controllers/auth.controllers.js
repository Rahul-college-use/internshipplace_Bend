import userModel from "../models/user.model.js";
import courseModel from "../models/course.model.js";
import chatModel from "../models/chat.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/config.js";

// 1. REGISTER
export async function register(req, res) {
  try {
    const existingUser = await userModel.findOne({
      $or: [
        { emailAddress: req.body.emailAddress },
        { contactNumber: req.body.contactNumber },
        { universityRoll: req.body.universityRoll },
        { universityReg: req.body.universityReg },
      ],
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const studentId = "STU" + Date.now() + crypto.randomBytes(2).toString("hex").toUpperCase();

    const user = await userModel.create({
      ...req.body,
      studentId,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id, email: user.emailAddress },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: userResponse,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 2. LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ emailAddress: email })
      .populate("enrolledCourses"); // Changed to match your new array name
    const isMatch = user && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.emailAddress },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true, // Safeguards token against XSS scripting attacks
      secure: process.env.NODE_ENV === "production", // true in production (requires HTTPS)
      sameSite: "lax", // Allows cross-port transmission for localhost development
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration tracking
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, email: user.emailAddress },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 3. GET ME
export async function getMe(req, res) {
  try {
    // CHANGED: Added .populate("selectCourse") so the frontend instantly gets full course details or null
    const user = await userModel.findById(req.user.id)
      .select("-password")
      .populate("enrolledCourses"); // Changed to match your new array name


    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 4. LOGOUT 
export async function logout(req, res) {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
}

// 5. GET USER DASHBOARD DATA (Populated for MainDashboard)
export async function getUserDashboardData(req, res) {
  try {
    const { userId } = req.params;
    
    // ✅ ADDED: .populate("enrolledCourses") to convert IDs into full course data objects!
    const user = await userModel.findById(userId)
      .select("-password")
      .populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 6. ADD NEW COURSE (Admin/Internal Utility)
export async function courseAdd(req, res) {
  try {
    const {
      courseName,
      description,
      thumbnail,
      courseStartDate,
      courseEndDate,
      status,
      cert,
      meta
    } = req.body;

    // 1. Strict Structural Validation Checklist
    if (!courseName || !description || !thumbnail || !courseStartDate || !courseEndDate || !cert || !meta) {
      return res.status(400).json({
        success: false,
        message: "Validation Failed: All fields including 'cert' and 'meta' are strictly required."
      });
    }

    // 2. Enum Value Safety Checks
    const validCerts = ['AICTE Compliant', 'UGC Compliant'];
    const validMetas = ['All Specializations', 'B.Tech / Diploma', 'Computer Applications'];

    if (!validCerts.includes(cert)) {
      return res.status(400).json({
        success: false,
        message: `Invalid certification type. Must be one of: ${validCerts.join(', ')}`
      });
    }

    if (!validMetas.includes(meta)) {
      return res.status(400).json({
        success: false,
        message: `Invalid meta categorization track. Must be one of: ${validMetas.join(', ')}`
      });
    }

    // 3. Persist the record inside MongoDB
    const newCourse = await courseModel.create({
      courseName,
      description,
      thumbnail,
      courseStartDate: new Date(courseStartDate),
      courseEndDate: new Date(courseEndDate),
      status: status || "active",
      cert,
      meta
    });

    return res.status(201).json({
      success: true,
      message: "New course specialization successfully injected into catalog database.",
      course: newCourse
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to persist new course record: " + err.message
    });
  }
}

// 7. GET ACTIVE COURSES FOR MARKETPLACE
export async function courseData(req, res) {
  try {
    // Query database for active courses, sorting by newest creation date first
    const activeCourses = await courseModel.find({ status: "active" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: activeCourses.length,
      courses: activeCourses
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course data catalog: " + err.message
    });
  }
}
// 8. ENROLL USER IN COURSE AFTER PAYMENT
export async function enrollInCourse(req, res) {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "Course ID is required." });
    }

    // Use $addToSet instead of $push to prevent duplicate enrollments for the same course!
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { enrolledCourses: courseId },
        $set: { isEnrolled: true }
      },
      { new: true }
    ).select("-password").populate("enrolledCourses");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Enrollment successful! Workspace unlocked.",
      user: updatedUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
export async function getClassChatHistory(req, res) {
  try {
    const { courseId } = req.params;
    // Fetch last 50 messages from the database
    const history = await chatModel.find({ courseId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return res.status(200).json({ success: true, history: history.reverse() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getRecordedLectures(req, res) {
  try {
    const { userId } = req.params;
    const user = await userModel.findById(userId).populate("enrolledCourses");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const activeTrack = user.enrolledCourses?.[0];
    if (!activeTrack) {
      return res.status(200).json({ success: true, playlist: [], progress: "0%" });
    }

    // Aapka live dynamic playlist object mapping array
    const productionPlaylist = [
      { id: 1, title: "Introduction to Structural Design", duration: "48:15", completed: true },
      { id: 2, title: "Types of Loads in Civil Structures", duration: "52:30", completed: true },
      { id: 3, title: "Load Calculation on Beams (Step by Step)", duration: "1:02:25", completed: false },
      { id: 4, title: "Bending Moment Diagram Analysis", duration: "1:10:40", completed: false },
      { id: 5, title: "Shear Force Diagram Calculations", duration: "1:26:30", completed: false }
    ];

    return res.status(200).json({
      success: true,
      courseTitle: activeTrack.courseName,
      playlist: productionPlaylist,
      progress: "50.3%",
      completedCount: 2
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

import attendanceModel from "../models/attendance.model.js";

export async function getUserAttendanceData(req, res) {
  try {
    const { userId } = req.params;

    // Fetch logs sorted from newest date down to oldest
    const logs = await attendanceModel.find({ userId }).sort({ date: -1 });

    // Calculate dynamic totals for the statistical overview metric blocks
    let presentCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;

    logs.forEach((log) => {
      if (log.status === "Present") presentCount++;
      if (log.status === "Absent") absentCount++;
      if (log.status === "Half Day") halfDayCount++;
    });

    // Format individual dates cleanly into localization standard presentation wrappers
    const formattedLogs = logs.map((log) => ({
      date: new Date(log.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: log.status,
      clockIn: log.clockIn,
      clockOut: log.clockOut,
      remarks: log.remarks,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        present: presentCount,
        absent: absentCount,
        halfDay: halfDayCount,
      },
      logs: formattedLogs,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}