import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

export const protect = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    try {
      // 2) Verify token
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_ACCESS_SECRET);

      // 3) Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new AppError('The user no longer exists.', 401));
      }

      // 4) Grant access
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please log in again.', 401));
      }
      if (error.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired. Please log in again.', 401));
      }
      next(error);
    }
  } catch (error) {
    next(error);
  }
};