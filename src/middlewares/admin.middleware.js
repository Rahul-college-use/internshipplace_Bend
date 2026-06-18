export async function verifyAdmin(req, res, next) {
  try {
    // req.user runtime attribute ko verifyToken middleware populate karta hai payload verify ke waqt
    const user = await userModel.findById(req.user._id);

    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied: Administrative Clearance Required." 
      });
    }

    next(); // Access permitted, clear validation gate
  } catch (err) {
    return res.status(500).json({ success: false, message: "Admin Validation Crash: " + err.message });
  }
}