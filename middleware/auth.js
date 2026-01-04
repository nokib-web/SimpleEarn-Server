import admin from '../utils/firebaseAdmin.js';
import { Users } from '../config/collections.js';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      return res.status(500).json({ message: 'Firebase Admin not initialized. Please check server configuration.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const user = await Users().findOne({ email: req.user.email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      req.userRole = user.role;
      req.userDoc = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ message: 'Error checking user role' });
    }
  };
};

// Convenience middleware for specific roles
export const verifyWorker = checkRole('worker');
export const verifyBuyer = checkRole('buyer');
export const verifyAdmin = checkRole('admin');
export const verifyBuyerOrAdmin = checkRole('buyer', 'admin');
export const verifyWorkerOrAdmin = checkRole('worker', 'admin');
