import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import connectDB from '../config/db';

// Load env vars
dotenv.config();

// Hàm tạo admin mặc định
const seedAdmin = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('MongoDB Connected');

    // Kiểm tra xem có admin nào chưa
    const adminCount = await Admin.countDocuments();

    if (adminCount === 0) {
      // Tạo admin mặc định từ biến môi trường
      const email = process.env.ADMIN_EMAIL || 'admin@example.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123';

      await Admin.create({
        name: 'Admin',
        email,
        password
      });

      console.log('Admin mặc định đã được tạo');
    } else {
      console.log('Admin đã tồn tại, không tạo mới');
    }

    // Đóng kết nối mongoose
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi tạo admin mặc định:', error);
    process.exit(1);
  }
};

// Chạy hàm seedAdmin
seedAdmin(); 