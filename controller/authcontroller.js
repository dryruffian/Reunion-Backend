import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { z } from 'zod';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';


const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET || 'access-secret-key', {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret-key', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const sendTokens = async (user, statusCode, req, res) => {
  try {
    const accessToken = createAccessToken(user._id);
    const refreshToken = createRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshToken;

    res.status(statusCode).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: { user: userObject }
    });
  } catch (error) {
    throw new AppError('Error creating tokens', 500);
  }
};

export const register = [
  validateRequest(registerSchema),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }

      const user = await User.create({
        name,
        email,
        password
      });

      await sendTokens(user, 201, req, res);
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }
];

export const login = [
  validateRequest(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Incorrect email or password', 401));
      }

      await sendTokens(user, 200, req, res);
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }
];

export const refresh = [
  validateRequest(refreshSchema),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      const decoded = await promisify(jwt.verify)(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret-key'
      );

      const user = await User.findById(decoded.id).select('+refreshToken');
      if (!user || user.refreshToken !== refreshToken) {
        return next(new AppError('Invalid refresh token', 401));
      }

      await sendTokens(user, 200, req, res);
    } catch (error) {
      next(new AppError('Invalid or expired refresh token', 401));
    }
  }
];

export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ 
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};