import express from 'express';
import { body } from 'express-validator';
import {
  spin,
  getSpins,
  getUserSpins,
  getSpinStats
} from '../controllers/spinController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Validation cho quay
const spinValidation = [
  body('userId', 'User ID không hợp lệ').isMongoId()
];

// Public routes
router.post('/', spinValidation, spin);
router.get('/user/:userId', getUserSpins);

// Admin routes
router.get('/', protect, authorize, getSpins);
router.get('/stats', protect, authorize, getSpinStats);

export default router; 