import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin, { IAdmin } from '../models/Admin';
import RefreshToken, { IRefreshToken } from '../models/RefreshToken';
import { AuthRequest } from '../middleware/auth';

// Hàm tạo access token từ thông tin admin
const generateAccessToken = (admin: IAdmin): string => {
  const secretKey = process.env.JWT_SECRET || 'edd98cce79a66ef3f5f8f7e267e785b765b8f25d606022eceab097ec1e46a95722a7b866c47d2ec1f157c2f9a710680b6f3aee967926e34d1ef80ed8746813e7';
  return jwt.sign(
    { id: admin._id },
    secretKey,
    { expiresIn: '1h' } // Access token hết hạn sau 1 giờ
  );
};

// Hàm tạo refresh token và lưu vào database
const generateRefreshToken = async (admin: IAdmin, ipAddress: string): Promise<IRefreshToken> => {
  // Tạo token ngẫu nhiên
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Thiết lập thời gian hết hạn (30 ngày)
  const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  // Tạo document refresh token
  const refreshTokenDoc = new RefreshToken({
    user: admin._id,
    token: refreshToken,
    expires: refreshTokenExpires,
    createdByIp: ipAddress
  });
  
  // Lưu vào database
  await refreshTokenDoc.save();
  
  return refreshTokenDoc;
};

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

    // Lấy địa chỉ IP của client
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // Tạo access token và refresh token
    const accessToken = generateAccessToken(admin);
    const refreshToken = await generateRefreshToken(admin, ipAddress);

    // Thiết lập HTTP-only cookie cho refresh token
    setRefreshTokenCookie(res, refreshToken.token);

    res.status(200).json({
      success: true,
      accessToken, // Chỉ trả về access token trong response body
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

// @desc    Làm mới access token bằng refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshTokenHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Không tìm thấy refresh token'
      });
      return;
    }

    // Tìm token trong database
    const refreshTokenDoc = await RefreshToken.findOne({ token: refreshToken });
    
    if (!refreshTokenDoc) {
      res.status(401).json({
        success: false,
        message: 'Token không tồn tại'
      });
      return;
    }

    // Kiểm tra token có hợp lệ không
    if (refreshTokenDoc.revoked || new Date() >= refreshTokenDoc.expires) {
      res.status(401).json({
        success: false,
        message: 'Token đã hết hạn hoặc bị thu hồi'
      });
      return;
    }

    // Lấy thông tin admin
    const admin = await Admin.findById(refreshTokenDoc.user);
    
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
      return;
    }

    // Lấy địa chỉ IP của client
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // Tạo refresh token mới
    const newRefreshToken = await generateRefreshToken(admin, ipAddress);
    
    // Thu hồi refresh token cũ
    refreshTokenDoc.revoked = true;
    refreshTokenDoc.revokedAt = new Date();
    refreshTokenDoc.replacedByToken = newRefreshToken.token;
    await refreshTokenDoc.save();
    
    // Tạo access token mới
    const accessToken = generateAccessToken(admin);
    
    // Thiết lập cookie mới
    setRefreshTokenCookie(res, newRefreshToken.token);

    res.status(200).json({
      success: true,
      accessToken,
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

// @desc    Đăng xuất và thu hồi refresh token
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Lấy refresh token từ cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Tìm và thu hồi token
      const refreshTokenDoc = await RefreshToken.findOne({ token: refreshToken });
      
      if (refreshTokenDoc) {
        refreshTokenDoc.revoked = true;
        refreshTokenDoc.revokedAt = new Date();
        await refreshTokenDoc.save();
      }
    }

    // Xóa cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
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

    // Lấy địa chỉ IP của client
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // Tạo access token và refresh token
    const accessToken = generateAccessToken(admin);
    const refreshToken = await generateRefreshToken(admin, ipAddress);

    // Thiết lập cookie
    setRefreshTokenCookie(res, refreshToken.token);

    res.status(201).json({
      success: true,
      accessToken,
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

// Hàm tiện ích để thiết lập cookie refresh token
const setRefreshTokenCookie = (res: Response, token: string): void => {
  // Cookie tồn tại trong 30 ngày
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Chỉ sử dụng HTTPS trong production
    signed: process.env.JWT_SECRET ? true : false, // Chỉ dùng signed cookies khi có JWT_SECRET
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    sameSite: 'strict' as const
  };

  res.cookie('refreshToken', token, cookieOptions);
}; 