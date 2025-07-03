import express from 'express';
import { body } from 'express-validator';
import {
  spin,
  getSpins,
  getUserSpins,
  getSpinStats,
  spinForEmployee
} from '../controllers/spinController';
import { protect, authorize } from '../middleware/auth';
import { paginate } from '../middleware/paginate';

const router = express.Router();

// Validation cho quay
const spinValidation = [
  body('userId', 'User ID không hợp lệ').isMongoId()
];

const employeeSpinValidation = [
  body('employeeCode', 'Mã nhân viên không được để trống').not().isEmpty()
];

// Public routes
router.post('/', spinValidation, spin);
router.post('/employee', employeeSpinValidation, spinForEmployee);
router.get('/user/:userId', paginate, getUserSpins);

// Admin routes
router.get('/', protect, authorize, paginate, getSpins);
router.get('/stats', protect, authorize, getSpinStats);

export default router; 