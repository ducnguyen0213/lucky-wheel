import express from 'express';
import { body } from 'express-validator';
import {
  getPrizes,
  getAllPrizes,
  getPrize,
  createPrize,
  updatePrize,
  deletePrize
} from '../controllers/prizeController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Validation cho tạo/cập nhật phần thưởng
const prizeValidation = [
  body('name', 'Vui lòng nhập tên phần thưởng').notEmpty(),
  body('probability', 'Tỉ lệ trúng thưởng phải từ 0-100').isFloat({ min: 0, max: 100 }),
  body('originalQuantity', 'Số lượng phải là số nguyên dương').isInt({ min: 0 })
];

// Admin routes - đặt trước routes có params
router.get('/admin/all', protect, authorize, getAllPrizes);
router.post('/', protect, authorize, prizeValidation, createPrize);

// Public routes
router.get('/', getPrizes);
router.get('/:id', getPrize);
router.put('/:id', protect, authorize, prizeValidation, updatePrize);
router.delete('/:id', protect, authorize, deletePrize);

export default router; 