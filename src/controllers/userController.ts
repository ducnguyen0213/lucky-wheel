import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import Spin from '../models/Spin';

// @desc    Lấy tất cả người dùng
// @route   GET /api/users
// @access  Private
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Lấy thông tin người dùng cụ thể
// @route   GET /api/users/:id
// @access  Private
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }

    // Lấy thông tin lượt quay của người dùng
    const spins = await Spin.find({ user: user._id })
      .populate('prize')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { user, spins }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Kiểm tra thông tin người dùng
// @route   POST /api/users/check
// @access  Public
export const checkUser = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { email, phone, codeShop, address } = req.body;

    // Tìm người dùng theo email hoặc số điện thoại
    let user = await User.findOne({
      $or: [{ email }, { phone }]
    });

    // Kiểm tra giới hạn lượt quay trong ngày
    if (user) {
      // Cập nhật codeShop nếu chưa có
      if (!user.codeShop && codeShop) {
        user.codeShop = codeShop;
        await user.save();
      }
      
      // Cập nhật address nếu được cung cấp
      if (address && (user.address !== address)) {
        user.address = address;
        await user.save();
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastSpinDate = new Date(user.lastSpinDate);
      lastSpinDate.setHours(0, 0, 0, 0);
      
      // Nếu ngày mới, reset lượt quay
      if (today.getTime() > lastSpinDate.getTime()) {
        user.spinsToday = 0;
        user.lastSpinDate = new Date();
        await user.save();
      }
      
      if (user.spinsToday >= 5) {
        res.status(400).json({
          success: false,
          message: 'Bạn đã hết lượt quay cho ngày hôm nay'
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        exists: !!user,
        user
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

// @desc    Tạo hoặc cập nhật người dùng
// @route   POST /api/users
// @access  Public
export const createOrUpdateUser = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { name, email, phone, codeShop, address } = req.body;

    // Tìm người dùng theo email hoặc số điện thoại
    let user = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (user) {
      // Cập nhật thông tin nếu người dùng đã tồn tại
      user.name = name;
      user.email = email;
      user.phone = phone;
      user.codeShop = codeShop;
      if (address) user.address = address;
      await user.save();
    } else {
      // Tạo người dùng mới
      user = await User.create({
        name,
        email,
        phone,
        codeShop,
        address
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Xuất dữ liệu người dùng
// @route   GET /api/users/export
// @access  Private
export const exportUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    // Chuyển đổi dữ liệu để dễ export
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      codeShop: user.codeShop,
      spinsToday: user.spinsToday,
      lastSpinDate: user.lastSpinDate,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
}; 