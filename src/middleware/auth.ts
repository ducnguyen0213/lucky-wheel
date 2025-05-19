import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin, { IAdmin } from '../models/Admin';
import RefreshToken from '../models/RefreshToken';

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
  try {
    let token;

    // Kiểm tra header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];
    } 
    // Nếu không có access token trong header, kiểm tra có refresh token không
    else if (req.cookies && req.cookies.refreshToken) {
      return await tryRefreshToken(req, res, next);
    }

    // Nếu không có token nào cả
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Không được phép truy cập, không có token'
      });
      return;
    }

    try {
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
      // Nếu token không hợp lệ hoặc đã hết hạn, thử dùng refresh token
      if (req.cookies && req.cookies.refreshToken) {
        return await tryRefreshToken(req, res, next);
      }

      res.status(401).json({
        success: false,
        message: 'Không được phép truy cập, token không hợp lệ'
      });
      return;
    }
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xác thực'
    });
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

// Hàm xử lý làm mới token khi access token hết hạn nhưng refresh token còn hiệu lực
const tryRefreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Phiên đã hết hạn, vui lòng đăng nhập lại'
      });
      return;
    }

    // Tìm refresh token trong database
    const refreshTokenDoc = await RefreshToken.findOne({ token: refreshToken });
    
    if (!refreshTokenDoc || refreshTokenDoc.revoked || Date.now() >= refreshTokenDoc.expires.getTime()) {
      res.status(401).json({
        success: false,
        message: 'Phiên đã hết hạn, vui lòng đăng nhập lại'
      });
      return;
    }

    // Tìm admin từ refresh token
    const admin = await Admin.findById(refreshTokenDoc.user);
    
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
      return;
    }

    // Tạo access token mới
    const accessToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    // Gán admin vào request
    req.admin = admin;

    // Trả về access token mới trong header
    res.setHeader('Authorization', `Bearer ${accessToken}`);
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');

    next();
  } catch (error) {
    console.error('Lỗi khi làm mới token:', error);
    res.status(401).json({
      success: false,
      message: 'Không thể làm mới phiên, vui lòng đăng nhập lại'
    });
  }
}; 