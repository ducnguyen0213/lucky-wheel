import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Prize, { IPrize } from '../models/Prize';
import { PaginatedRequest, getPaginationInfo, paginate } from '../middleware/paginate';

// @desc    Lấy tất cả phần thưởng
// @route   GET /api/prizes
// @access  Public
export const getPrizes = async (req: Request, res: Response): Promise<void> => {
  try {
    const prizes = await Prize.find({ active: true });

    res.status(200).json({
      success: true,
      count: prizes.length,
      data: prizes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Lấy tất cả phần thưởng (bao gồm cả không active) - cho admin
// @route   GET /api/prizes/all
// @access  Private
export const getAllPrizes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = (req as PaginatedRequest).pagination;
    
    // Đếm tổng số phần thưởng
    const totalItems = await Prize.countDocuments();
    
    // Lấy phần thưởng có phân trang
    const prizes = await Prize.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Lấy thông tin phân trang
    const pagination = getPaginationInfo(totalItems, page, limit);

    res.status(200).json({
      success: true,
      pagination,
      data: prizes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Lấy một phần thưởng cụ thể
// @route   GET /api/prizes/:id
// @access  Public
export const getPrize = async (req: Request, res: Response): Promise<void> => {
  try {
    const prize = await Prize.findById(req.params.id);

    if (!prize) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy phần thưởng'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: prize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Tạo phần thưởng mới
// @route   POST /api/prizes
// @access  Private
export const createPrize = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    // Tạo phần thưởng mới
    const { name, description, imageUrl, probability, originalQuantity } = req.body;
    
    const prize = await Prize.create({
      name,
      description,
      imageUrl,
      probability,
      originalQuantity,
      remainingQuantity: originalQuantity
    });

    res.status(201).json({
      success: true,
      data: prize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Cập nhật phần thưởng
// @route   PUT /api/prizes/:id
// @access  Private
export const updatePrize = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    let prize = await Prize.findById(req.params.id);

    if (!prize) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy phần thưởng'
      });
      return;
    }

    // Nếu có cập nhật originalQuantity, phải tính toán lại remainingQuantity
    const originalQuantityChange = 
      req.body.originalQuantity !== undefined && 
      req.body.originalQuantity !== prize.originalQuantity;
    
    if (originalQuantityChange) {
      const quantityDiff = req.body.originalQuantity - prize.originalQuantity;
      req.body.remainingQuantity = prize.remainingQuantity + quantityDiff;
    }

    prize = await Prize.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: prize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
};

// @desc    Xóa phần thưởng
// @route   DELETE /api/prizes/:id
// @access  Private
export const deletePrize = async (req: Request, res: Response): Promise<void> => {
  try {
    const prize = await Prize.findById(req.params.id);

    if (!prize) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy phần thưởng'
      });
      return;
    }

    await prize.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ'
    });
  }
}; 