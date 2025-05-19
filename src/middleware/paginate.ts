import { Request, Response, NextFunction } from 'express';

// Interface cho các tham số phân trang
export interface PaginationResult {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Interface mở rộng request để bao gồm thông tin phân trang
export interface PaginatedRequest extends Request {
  pagination: {
    page: number;
    limit: number;
    skip: number;
  };
}

// Middleware phân trang
export const paginate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Lấy tham số page và limit từ query string
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string) || 10, 1),
    100 // Giới hạn tối đa là 100 items mỗi trang
  );
  const skip = (page - 1) * limit;

  // Gán thông tin phân trang vào request để controller có thể sử dụng
  (req as PaginatedRequest).pagination = {
    page,
    limit,
    skip
  };

  next();
};

// Hàm tiện ích tạo đối tượng kết quả phân trang
export const getPaginationInfo = (
  totalItems: number,
  page: number,
  limit: number
): PaginationResult => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    page,
    limit,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}; 