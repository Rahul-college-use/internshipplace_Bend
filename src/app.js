import express from "express";
import morgan from "morgan";
import dns from "dns";
import cors from "cors";
import { createServer } from "http";
import * as socketIO from "socket.io"; // Fixed: Namespace star import satisfies strict Node ESM loaders
import authRouter from "./routes/auth.routes.js";
import chatModel from "./models/chat.model.js";

// Force stable public fallback DNS resolution environments
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// Configure Cross-Origin Resource Sharing rules
const corsOptions = {
  origin: ["http://localhost:5173", "https://auth-frontend-alpha-one.vercel.app"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Global Pipeline Request Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev")); // Real-time console endpoint hit logger

// Application Router Mount Gateways
app.use("/api/auth", authRouter);

// ─── SOCKET.IO PRODUCTION INTEGRATION LAYER ─────────────────────────

// 1. Wrap the Express app instance with a native Node HTTP Server
const httpServer = createServer(app);

// 2. Attach Socket.io using the namespace resolution reference
const io = new socketIO.Server(httpServer, {
  cors: corsOptions
});

// 3. Real-time Classroom Channel Event Pipeline handlers
io.on("connection", (socket) => {
  // console.log(`User connected to live grid: ${socket.id}`);

  // Listen for a student locking into their batch classroom room channel
  socket.on("join_classroom", ({ courseId }) => {
    socket.join(courseId);
  });

  // Listen for live text messages and pipe them straight to MongoDB + current room users
  socket.on("send_message", async (data) => {
    try {
      const { courseId, user, text, isInstructor } = data;

      // Persist to MongoDB permanently
      const savedMsg = await chatModel.create({
        courseId,
        user,
        text,
        isInstructor: isInstructor || false
      });

      // Broadcast live back out to everyone explicitly joined to this course room channel
      io.to(courseId).emit("receive_message", {
        user: savedMsg.user,
        text: savedMsg.text,
        isInstructor: savedMsg.isInstructor,
        createdAt: savedMsg.createdAt
      });
    } catch (err) {
      console.error("Failed to process real-time socket chat transaction:", err);
    }
  });

  socket.on("disconnect", () => {
    // Clean up connections automatically
  });
});

// Export the composite wrapper instance instead of the raw app layout framework
export default httpServer;