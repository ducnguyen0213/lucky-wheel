import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';

// Interface mở rộng cho Request có thêm đối tượng admin
export interface AuthRequest extends Request {
  admin?: IAdmin;
}

// Middleware bảo vệ route, yêu cầu đăng nhập
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  // Kiểm tra header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'defaultsecret'
      ) as { id: string };

      // Tìm admin và gán vào request
      const admin = await Admin.findById(decoded.id);
      
      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Admin không tồn tại'
        });
        return;
      }
      
      req.admin = admin;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Không được phép truy cập, token không hợp lệ'
      });
      return;
    }
  } else if (!token) {
    res.status(401).json({
      success: false,
      message: 'Không được phép truy cập, không có token'
    });
    return;
  }
};

// Kiểm tra user có quyền admin không
export const authorize = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.admin) {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập vào trang này'
    });
    return;
  }

  next();
}; 