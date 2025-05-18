import express from 'express';
import { body } from 'express-validator';
import { login, getMe, register } from '../controllers/authController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Validation cho đăng nhập
const loginValidation = [
  body('email', 'Vui lòng nhập email hợp lệ').isEmail(),
  body('password', 'Mật khẩu không được để trống').notEmpty()
];

// Validation cho đăng ký
const registerValidation = [
  body('name', 'Vui lòng nhập tên').notEmpty(),
  body('email', 'Vui lòng nhập email hợp lệ').isEmail(),
  body('password', 'Mật khẩu phải có ít nhất 6 ký tự').isLength({ min: 6 })
];

// Routes
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/register', registerValidation, protect, authorize, register);

export default router; 