import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Admin, { IAdmin } from '../models/Admin';
import { AuthRequest } from '../middleware/auth';

// @desc    Đăng nhập admin
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    // Kiểm tra email
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
      return;
    }

    // Kiểm tra mật khẩu
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
      return;
    }

    // Tạo token
    const token = admin.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Lấy thông tin admin hiện tại
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Tạo tài khoản admin (chỉ dùng khi cần thiết)
// @route   POST /api/auth/register
// @access  Private
export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { name, email, password } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
      return;
    }

    // Tạo admin mới
    const admin = await Admin.create({
      name,
      email,
      password
    });

    // Trả về token
    const token = admin.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
}; 