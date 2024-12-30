import express from 'express';
import { register, login, refresh, logout } from '../controller/authcontroller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

export default router;