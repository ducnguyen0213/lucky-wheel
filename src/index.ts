import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';

// Load các routes
import authRoutes from './routes/authRoutes';
import prizeRoutes from './routes/prizeRoutes';
import userRoutes from './routes/userRoutes';
import spinRoutes from './routes/spinRoutes';

// Load env vars
dotenv.config();

// Kết nối Database
connectDB();

// Khởi tạo express app
const app = express();

// Thiết lập CORS để cho phép credentials (cookies)
app.use(cors({
  origin: function(origin, callback) {
    // Trong môi trường development, origin có thể là null
    if (!origin || /localhost/.test(origin)) {
      callback(null, true);
      return;
    }
    
    // Danh sách các domain được phép
    const allowedOrigins = [
      'https://lucky-wheel-cicl.onrender.com',
      'https://luck-wheel-fe.vercel.app/',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(null, true); // Cho phép tạm thời để debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET)); // Sử dụng cookie-parser với JWT_SECRET làm cookie secret

// Định nghĩa routes
app.use('/api/auth', authRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/spins', spinRoutes);

// Route mặc định
app.get('/', (req: Request, res: Response) => {
  res.send('API của Lucky Wheel đang chạy');
});

// Middleware xử lý lỗi
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ'
  });
});

// Xử lý routes không tồn tại
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route không tồn tại'
  });
});

// Thiết lập port và chạy server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

// Xử lý lỗi không xử lý được
process.on('unhandledRejection', (err: Error) => {
  console.log(`Lỗi: ${err.message}`);
  // Đóng server & thoát process
  server.close(() => process.exit(1));
}); 