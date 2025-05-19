import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUser,
  checkUser,
  createOrUpdateUser,
  exportUsers
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { paginate } from '../middleware/paginate';

const router = express.Router();

// Validation cho người dùng
const userValidation = [
  body('name', 'Vui lòng nhập họ tên').notEmpty(),
  body('email', 'Vui lòng nhập email hợp lệ').isEmail(),
  body('phone', 'Vui lòng nhập số điện thoại hợp lệ')
    .notEmpty()
    .matches(/^(0|\+84)(\d{9,10})$/),
  body('codeShop', 'Vui lòng nhập mã cửa hàng').notEmpty()
];

// Validation cho kiểm tra người dùng
const checkUserValidation = [
  body('email', 'Vui lòng nhập email hợp lệ').isEmail(),
  body('phone', 'Vui lòng nhập số điện thoại hợp lệ')
    .notEmpty()
    .matches(/^(0|\+84)(\d{9,10})$/)
];

// Public routes
router.post('/check', checkUserValidation, checkUser);
router.post('/', userValidation, createOrUpdateUser);

// Admin routes
router.get('/', protect, authorize, paginate, getUsers);
router.get('/export', protect, authorize, paginate, exportUsers);
router.get('/:id', protect, authorize, getUser);

export default router; 