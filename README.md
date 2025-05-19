# Lucky Wheel API

API Backend cho ứng dụng vòng quay may mắn với các tính năng:
- Quản lý người dùng
- Quản lý phần thưởng
- Quản lý vòng quay may mắn
- Thống kê dữ liệu

## Yêu cầu

- Node.js (v14+)
- MongoDB
- TypeScript

## Cài đặt

1. Clone dự án
```bash
git clone <repository-url>
cd lucky-wheel
```

2. Cài đặt các gói phụ thuộc
```bash
npm install
```

4. Khởi tạo tài khoản admin mặc định
```bash
npm run seed
```

5. Chạy ứng dụng (development)
```bash
npm run dev
```

6. Build và chạy cho production
```bash
npm run build
npm start
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Đăng nhập admin
- `GET /api/auth/me` - Lấy thông tin admin hiện tại
- `POST /api/auth/register` - Đăng ký admin mới (chỉ admin hiện tại mới được phép)

### Prizes (Phần thưởng)
- `GET /api/prizes` - Lấy danh sách phần thưởng (public)
- `GET /api/prizes/:id` - Lấy thông tin phần thưởng cụ thể
- `GET /api/prizes/admin/all` - Lấy tất cả phần thưởng (admin)
- `POST /api/prizes` - Tạo phần thưởng mới (admin)
- `PUT /api/prizes/:id` - Cập nhật phần thưởng (admin)
- `DELETE /api/prizes/:id` - Xóa phần thưởng (admin)

### Users (Người dùng)
- `POST /api/users/check` - Kiểm tra thông tin người dùng
- `POST /api/users` - Tạo hoặc cập nhật người dùng
- `GET /api/users` - Lấy danh sách người dùng (admin)
- `GET /api/users/:id` - Lấy thông tin người dùng cụ thể (admin)
- `GET /api/users/export` - Xuất dữ liệu người dùng (admin)

### Spins (Vòng quay)
- `POST /api/spins` - Quay vòng quay
- `GET /api/spins/user/:userId` - Lấy lịch sử quay của người dùng
- `GET /api/spins` - Lấy tất cả lịch sử quay (admin)
- `GET /api/spins/stats` - Lấy thống kê vòng quay (admin)

## Công nghệ sử dụng

- Express.js - Framework web
- TypeScript - Ngôn ngữ lập trình
- MongoDB & Mongoose - Database & ODM
- JWT - Xác thực
- Validator - Kiểm tra dữ liệu
- Express-Validator - Validation middleware 