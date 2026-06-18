export const verifyAdmin = (req, res, next) => {
  try {
    // ✅ Safe validation parsing handles both standard types
    if (req.user && (req.user.isAdmin === true || req.user.isAdmin === "true")) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admins only." 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};