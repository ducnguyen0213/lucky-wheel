import express from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  deleteManyEmployees,
  verifyEmployee,
  importEmployees,
} from '../controllers/employeeController';
import { protect } from '../middleware/auth';
import { paginate } from '../middleware/paginate';
import multer from 'multer';

const router = express.Router();

// Cấu hình multer để lưu file vào bộ nhớ
const upload = multer({ storage: multer.memoryStorage() });

router.route('/verify/:employeeCode').get(verifyEmployee);

router
  .route('/')
  .post(protect, createEmployee)
  .get(protect, paginate, getEmployees)
  .delete(protect, deleteManyEmployees);

// Route import nhân viên từ Excel
router.post('/import', protect, upload.single('file'), importEmployees);

router
  .route('/:id')
  .get(protect, getEmployee)
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

export default router; 