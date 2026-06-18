import app from "./src/app.js";
import connectDB from "./src/config/database.js";

const PORT = 3000;

// Initialize Database connection FIRST
connectDB()
  .then(() => {
    // Only start accepting API requests once the database is safely online
    app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(`🚀 Server running smoothly on http://localhost:${PORT}`);
      console.log(`=============================================`);
    });
  })
  .catch((err) => {
    console.error("CRITICAL: Failed to initialize backend systems:", err);
    process.exit(1);
  });