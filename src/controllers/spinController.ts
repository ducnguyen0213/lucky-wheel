import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Prize from '../models/Prize';
import Spin from '../models/Spin';
import { checkAndSendWinningEmail, checkAndSendWinningEmailForEmployee } from '../utils/emailService';
import { PaginatedRequest, getPaginationInfo, paginate } from '../middleware/paginate';
import Employee from '../models/Employee';

// @desc    Quay thưởng
// @route   POST /api/spins
// @access  Public
const spin = async (req: Request, res: Response): Promise<void> => {
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
          isWin = !!selectedPrize && selectedPrize.isRealPrize;
          break;
        }
      }
      
      // Nếu trúng thưởng, giảm số lượng phần thưởng còn lại
      if (selectedPrize) {
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
    
    // Kiểm tra và gửi email nếu đã quay đủ 5 lần
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

// @desc    Nhân viên quay thưởng
// @route   POST /api/spins/employee
// @access  Public
const spinForEmployee = async (req: Request, res: Response): Promise<void> => {
    const { employeeCode } = req.body;

    if (!employeeCode) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã nhân viên' });
        return;
    }

    try {
        // 1. Tìm nhân viên
        const employee = await Employee.findOne({ employeeCode });
        if (!employee) {
            res.status(404).json({ success: false, message: 'Mã nhân viên không hợp lệ' });
            return;
        }

        // 2. Kiểm tra lượt quay
        const totalSpins = calculateTotalSpins(employee.machinesSold);
        if (employee.spinsUsed >= totalSpins) {
            res.status(400).json({ success: false, message: 'Bạn đã hết lượt quay' });
            return;
        }

        // 3. Xác định Bậc giải thưởng từ chuỗi
        const prizeTier = employee.spinTierSequence[employee.spinsUsed];
        if (!prizeTier) {
            res.status(500).json({ success: false, message: 'Lỗi hệ thống: Không thể xác định bậc giải thưởng.' });
            return;
        }

        // 4. Lấy giải thưởng trong Bậc đó
        const prizesInTier = await Prize.find({ tier: prizeTier, active: true, remainingQuantity: { $gt: 0 } });
        if (prizesInTier.length === 0) {
            res.status(404).json({ success: false, message: `Hiện không có giải thưởng nào cho Bậc ${prizeTier}. Vui lòng thử lại sau.` });
            return;
        }

        // 5. Quay ngẫu nhiên trong Bậc
        const prizePool = prizesInTier.map(p => ({ prize: p, probability: p.probability }));
        const totalProbability = prizePool.reduce((sum, p) => sum + p.probability, 0);
        
        const randomValue = Math.random() * totalProbability;
        let cumulativeProbability = 0;
        let selectedPrize = null;

        for (const item of prizePool) {
            cumulativeProbability += item.probability;
            if (randomValue <= cumulativeProbability) {
                selectedPrize = item.prize;
                break;
            }
        }
        
        // Mặc định chọn giải đầu tiên nếu có lỗi
        if (!selectedPrize && prizesInTier.length > 0) {
            selectedPrize = prizesInTier[0];
        }

        // 6. Cập nhật và lưu
        if (selectedPrize) {
            selectedPrize.remainingQuantity -= 1;
            await selectedPrize.save();
        }
        
        employee.spinsUsed += 1;
        const updatedEmployee = await employee.save();

        // 7. Lưu lịch sử
        const spin = await Spin.create({
            employee: employee._id,
            prize: selectedPrize ? selectedPrize._id : null,
            isWin: !!selectedPrize
        });
        
        const spinWithPrize = await Spin.findById(spin._id).populate('prize');

        // 8. Kiểm tra và gửi email nếu hết lượt
        if (updatedEmployee.spinsUsed >= totalSpins) {
            // Gửi email bất đồng bộ
            checkAndSendWinningEmailForEmployee(updatedEmployee).catch(err => {
                console.error('Lỗi nền khi gửi email cho nhân viên:', err);
            });
        }

        res.status(200).json({
            success: true,
            data: {
                spin: spinWithPrize,
                isWin: !!selectedPrize,
                remainingSpins: totalSpins - employee.spinsUsed
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ',
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        });
    }
};

const calculateTotalSpins = (machinesSold: number): number => {
    if (machinesSold >= 10) return 6;
    if (machinesSold >= 5) return 3;
    if (machinesSold >= 1) return 1;
    return 0;
};

// @desc    Lấy lịch sử quay
// @route   GET /api/spins
// @access  Private
const getSpins = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = (req as PaginatedRequest).pagination;
    
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
    
    // Đếm tổng số lịch sử quay theo filter
    const totalItems = await Spin.countDocuments(filter);
    
    // Lấy lịch sử quay có phân trang
    const spins = await Spin.find(filter)
      .populate({
        path: 'user',
        select: 'name email phone address codeShop'
      })
      .populate({
        path: 'employee',
        select: 'name email phone codeShop'
      })
      .populate('prize')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Lấy thông tin phân trang
    const pagination = getPaginationInfo(totalItems, page, limit);

    res.status(200).json({
      success: true,
      pagination,
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
const getUserSpins = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { page, limit, skip } = (req as PaginatedRequest).pagination;
    
    // Đếm tổng số lịch sử quay của user
    const totalItems = await Spin.countDocuments({ user: userId });
    
    // Lấy lịch sử quay có phân trang
    const spins = await Spin.find({ user: userId })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate('prize')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const user = await User.findById(userId, 'name email phone address codeShop spinsToday lastSpinDate');
    
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

    // Lấy thông tin phân trang
    const pagination = getPaginationInfo(totalItems, page, limit);

    res.status(200).json({
      success: true,
      pagination,
      data: {
        spins,
        user,
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
const getSpinStats = async (req: Request, res: Response): Promise<void> => {
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

export {
    spin,
    getSpins,
    getUserSpins,
    getSpinStats,
    spinForEmployee,
    calculateTotalSpins,
}; 