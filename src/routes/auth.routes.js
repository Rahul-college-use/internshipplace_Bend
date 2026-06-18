import { Router } from "express";
import * as authController from '../controllers/auth.controllers.js';
import { verifyToken } from "../middlewares/auth.middleware.js"; // ✅ Safely imported from centralization middleware file
import { verifyAdmin } from "../middlewares/admin.middleware.js"; 
import { getAllStudents, updateStudentStatus } from "../controllers/admin.controllers.js";

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
authRouter.post('/coursesAdd', verifyToken, verifyAdmin, authController.courseAdd); // Secured course adding for admin only
authRouter.get("/admin/students", verifyToken, verifyAdmin, getAllStudents);
authRouter.patch("/admin/student-status/:studentIdToUpdate", verifyToken, verifyAdmin, updateStudentStatus);

export default authRouter;