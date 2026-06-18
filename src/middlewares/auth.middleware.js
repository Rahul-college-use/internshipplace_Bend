import jwt from "jsonwebtoken";
import config from "../config/config.js";

/**
 * Centered Token Validation Middleware Gateway
 * Express requests pass through this controller layer to verify identity rules
 */
export function verifyToken(req, res, next) {
  // Extract token from the HTTP Authorization header context
  const authHeader = req.headers['authorization'];
  
  // Clean split configuration mapping: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: No authentication token found in request headers."
    });
  }

  try {
    // Verify the validity of the token signature against our secure environment secret
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Attach the decoded data object (e.g., _id, email) safely onto the request pipeline
    req.user = decoded; 
    
    next(); // All security checks clear. Hand over execution to next destination hook.
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Invalid, expired, or corrupted authentication token."
    });
  }
}