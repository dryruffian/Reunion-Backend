
import { z } from 'zod';
import Todo from '../models/todo.model.js';
import AppError from '../utils/appError.js';


const todoSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot be more than 100 characters'),
  description: z.string()
    .max(500, 'Description cannot be more than 500 characters')
    .optional(),
  status: z.enum(['pending', 'finished'])
    .default('pending'),
  priority: z.enum(['low', 'medium', 'high'])
    .default('medium'),
  endDate: z.string().datetime('Invalid date format'),
  startDate: z.string().datetime('Invalid date format'),
  isCompleted: z.boolean().default(false)
});


export const getTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: todos.length,
      data: { todos }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};


export const createTodo = async (req, res, next) => {
  try {
    const validatedData = todoSchema.parse(req.body);
    
    const todo = await Todo.create({
      ...validatedData,
      user: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: { todo }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(new AppError(error.message, 400));
  }
};


export const updateTodo = async (req, res, next) => {
  try {
    const validatedData = todoSchema.partial().parse(req.body);

    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      validatedData,
      { new: true, runValidators: true }
    );

    if (!todo) {
      return next(new AppError('Todo not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { todo }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(new AppError(error.message, 400));
  }
};

export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return next(new AppError('Todo not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const getTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return next(new AppError('Todo not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { todo }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const toggleComplete = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return next(new AppError('Todo not found', 404));
    }

    await todo.toggleComplete();

    res.status(200).json({
      status: 'success',
      data: { todo }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const getOverdueTodos = async (req, res, next) => {
  try {
    const todos = await Todo.getOverdueTodos(req.user._id);

    res.status(200).json({
      status: 'success',
      results: todos.length,
      data: { todos }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};