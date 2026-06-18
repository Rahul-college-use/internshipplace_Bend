import { Router } from "express";
import * as authController from '../controllers/auth.controllers.js';
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { deleteCourse } from "../controllers/admin.controllers.js";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";

// ✅ FIXED: Clean single line import for all administrative actions controllers
import {
  getAllStudents,
  updateStudentStatus,
  getCourseEnrollmentMatrix,
  toggleCourseChat
} from "../controllers/admin.controllers.js";

const authRouter = Router();

// ==========================================
// ROUTE DEFINITIONS
// ==========================================

// 1. Public Health check or base entry point
authRouter.get('/', (req, res) => {
  res.send("api/auth/@demo");
});

// 2. Public Authentication Actions
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

// 3. Secured Private Workspace Actions (Protected by verifyToken middleware)
authRouter.get('/getStoredUser', verifyToken, authController.getMe);
authRouter.get('/dashboard/:userId', verifyToken, authController.getUserDashboardData);
authRouter.get("/chat/history/:courseId", verifyToken, authController.getClassChatHistory);
authRouter.get("/lectures/:userId", verifyToken, authController.getRecordedLectures);

// 4. Course Enrollment Trackers
authRouter.get('/coursesData', authController.courseData); // Fetch list for marketplace layout
authRouter.post('/enroll', verifyToken, authController.enrollInCourse);

// 5. Administrative Controls Gateways (Protected by verifyToken AND verifyAdmin)
authRouter.post('/coursesAdd', verifyToken, verifyAdmin, authController.courseAdd);
authRouter.get("/admin/students", verifyToken, verifyAdmin, getAllStudents);
authRouter.patch("/admin/student-status/:studentIdToUpdate", verifyToken, verifyAdmin, updateStudentStatus);
authRouter.get("/admin/course-matrix", verifyToken, verifyAdmin, getCourseEnrollmentMatrix);
authRouter.patch("/admin/toggle-chat/:courseId", verifyToken, verifyAdmin, toggleCourseChat);
authRouter.delete("/admin/delete-course/:courseId", verifyToken, verifyAdmin, deleteCourse);


authRouter.post('/Admincreate', async (req, res) => {
  try {
    const { fullName, emailAddress, password, superSecretPasskey } = req.body;

    // 1. Passkey Check
    if (superSecretPasskey !== "GECJ_TPO_MASTER_KEY_2026") {
      return res.status(403).json({ success: false, message: "Invalid Secret Passkey!" });
    }

    // 2. Duplicate Email Check
    const existingUser = await userModel.findOne({ emailAddress });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered!" });
    }

    // 3. Password Encryption
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create Admin User providing required schema fallbacks
    const newAdmin = await userModel.create({
      fullName,
      emailAddress,
      password: hashedPassword,
      isAdmin: true,
      isVerified: true,
      registrationStatus: "Approved",
      contactNumber: "0000000000",
      gender: "Male",
      department: "Administration",
      
      // ✅ Schema Required Fallbacks to bypass validation errors
      parentName: "ADMIN_ROOT",
      universityId: "ADMIN",
      collegeId: "ADMIN",
      semester: "Administration",
      session: "2026",
      universityRoll: "ADMIN_MASTER",
      universityReg: "ADMIN_MASTER",
      emergencyName: "ADMIN_SUPPORT",
      emergencyPhone: "0000000000",
      relationship: "Guardian"
    });

    return res.status(201).json({
      success: true,
      message: "🎉 Admin account created successfully!",
      adminId: newAdmin._id
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Error: " + err.message });
  }
});
export default authRouter;
