import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Prize from '../models/Prize';
import Spin from '../models/Spin';
import { checkAndSendWinningEmail } from '../utils/emailService';

// @desc    Quay thưởng
// @route   POST /api/spins
// @access  Public
export const spin = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { userId } = req.body;

    // Kiểm tra người dùng
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }

    // Kiểm tra và cập nhật codeShop nếu chưa có
    if (!user.codeShop) {
      user.codeShop = "SHOP_DEFAULT"; // Mã mặc định
    }

    // Kiểm tra giới hạn lượt quay trong ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastSpinDate = new Date(user.lastSpinDate);
    lastSpinDate.setHours(0, 0, 0, 0);
    
    // Nếu ngày mới, reset lượt quay
    if (today.getTime() > lastSpinDate.getTime()) {
      user.spinsToday = 0;
      user.lastSpinDate = new Date();
    }
    
    if (user.spinsToday >= 5) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã hết lượt quay cho ngày hôm nay'
      });
      return;
    }

    // Lấy danh sách phần thưởng
    const availablePrizes = await Prize.find({ 
      active: true, 
      remainingQuantity: { $gt: 0 } 
    });

    // Tính toán phần thưởng
    let selectedPrize = null;
    let isWin = false;

    if (availablePrizes.length > 0) {
      // Tạo mảng các phần thưởng với tỉ lệ tương ứng
      const prizePool: any[] = [];
      let remainingProbability = 100;
      
      // Thêm các phần thưởng có xác suất vào pool
      availablePrizes.forEach(prize => {
        prizePool.push({
          prize,
          probability: prize.probability
        });
        remainingProbability -= prize.probability;
      });
      
      // Thêm trường hợp không trúng thưởng vào pool
      if (remainingProbability > 0) {
        prizePool.push({
          prize: null,
          probability: remainingProbability
        });
      }
      
      // Random từ 0-100
      const randomValue = Math.random() * 100;
      let cumulativeProbability = 0;
      
      // Xác định phần thưởng dựa trên xác suất
      for (const item of prizePool) {
        cumulativeProbability += item.probability;
        if (randomValue <= cumulativeProbability) {
          selectedPrize = item.prize;
          isWin = !!selectedPrize;
          break;
        }
      }
      
      // Nếu trúng thưởng, giảm số lượng phần thưởng còn lại
      if (isWin && selectedPrize) {
        selectedPrize.remainingQuantity -= 1;
        await selectedPrize.save();
      }
    }

    // Tăng số lượt quay của người dùng
    user.spinsToday += 1;
    user.lastSpinDate = new Date();
    await user.save();

    // Lưu lịch sử quay
    const spin = await Spin.create({
      user: user._id,
      prize: selectedPrize ? selectedPrize._id : null,
      isWin
    });

    // Populate prize details
    const spinWithPrize = await Spin.findById(spin._id).populate('prize');
    
    // Kiểm tra và gửi email nếu đủ điều kiện
    if (user.spinsToday >= 5 && user.email) {
      // Gửi email bất đồng bộ để không ảnh hưởng đến response
      checkAndSendWinningEmail(user).catch((err: Error) => {
        console.error('Lỗi gửi email:', err);
      });
    }

    res.status(200).json({
      success: true,
      data: {
        spin: spinWithPrize,
        isWin,
        remainingSpins: 5 - user.spinsToday
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
    });
  }
};

// @desc    Lấy lịch sử quay
// @route   GET /api/spins
// @access  Private
export const getSpins = async (req: Request, res: Response): Promise<void> => {
  try {
    // Filter theo ngày nếu có
    let filter = {};
    
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      endDate.setHours(23, 59, 59, 999);
      
      filter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
    
    const spins = await Spin.find(filter)
      .populate('user')
      .populate('prize')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: spins.length,
      data: spins
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
    });
  }
};

// @desc    Lấy lịch sử quay của một người dùng
// @route   GET /api/spins/user/:userId
// @access  Public/Private
export const getUserSpins = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    const spins = await Spin.find({ user: userId })
      .populate('prize')
      .sort({ createdAt: -1 });

    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
      return;
    }

    // Tính toán lượt quay còn lại trong ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastSpinDate = new Date(user.lastSpinDate);
    lastSpinDate.setHours(0, 0, 0, 0);
    
    let remainingSpins = 5;
    
    if (today.getTime() === lastSpinDate.getTime()) {
      remainingSpins = 5 - user.spinsToday;
    }

    res.status(200).json({
      success: true,
      count: spins.length,
      data: {
        spins,
        remainingSpins
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
    });
  }
};

// @desc    Thống kê
// @route   GET /api/spins/stats
// @access  Private
export const getSpinStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Filter theo ngày nếu có
    let dateFilter = {};
    
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      endDate.setHours(23, 59, 59, 999);
      
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
    
    // Tổng số lượt quay
    const totalSpins = await Spin.countDocuments(dateFilter);
    
    // Số lượt trúng thưởng
    const totalWins = await Spin.countDocuments({
      ...dateFilter,
      isWin: true
    });
    
    // Số lượng người chơi
    const uniqueUsers = await Spin.distinct('user', dateFilter);
    
    // Thống kê theo phần thưởng
    const prizeStats = await Spin.aggregate([
      { $match: { ...dateFilter, isWin: true } },
      { $group: { 
        _id: '$prize', 
        count: { $sum: 1 } 
      }},
      { $lookup: {
        from: 'prizes',
        localField: '_id',
        foreignField: '_id',
        as: 'prizeDetails'
      }},
      { $unwind: '$prizeDetails' },
      { $project: {
        _id: 1,
        count: 1,
        name: '$prizeDetails.name',
        originalQuantity: '$prizeDetails.originalQuantity',
        remainingQuantity: '$prizeDetails.remainingQuantity'
      }}
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSpins,
        totalWins,
        uniqueUsersCount: uniqueUsers.length,
        winRate: totalSpins ? (totalWins / totalSpins * 100).toFixed(2) : 0,
        prizeStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error instanceof Error ? error.message : 'Lỗi không xác định',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
    });
  }
}; 