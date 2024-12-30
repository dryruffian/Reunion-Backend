// routes/todo.routes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  getTodo,
  toggleComplete,
  getOverdueTodos
} from '../controller/todo.controller.js';

const router = express.Router();


router.use(protect);

router.route('/')
  .get(getTodos)
  .post(createTodo);

router.get('/overdue', getOverdueTodos);

router.route('/:id')
  .get(getTodo)
  .patch(updateTodo)
  .delete(deleteTodo);

router.patch('/:id/toggle', toggleComplete);

export default router;