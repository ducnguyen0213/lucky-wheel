import express from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  verifyEmployee,
} from '../controllers/employeeController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.route('/verify/:employeeCode').get(verifyEmployee);

router.route('/').post(protect, createEmployee).get(protect, getEmployees);

router
  .route('/:id')
  .get(protect, getEmployee)
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

export default router; 