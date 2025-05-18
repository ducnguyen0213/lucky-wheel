# Tài liệu API Lucky Wheel

## Xác thực (Authentication)

### Đăng nhập Admin
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```
- **Phản hồi**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "Admin",
      "email": "admin@example.com"
    }
  }
  ```

### Lấy thông tin Admin hiện tại
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Admin",
      "email": "admin@example.com",
      "createdAt": "2023-05-17T12:00:00.000Z"
    }
  }
  ```

### Đăng ký Admin mới (chỉ admin hiện tại mới thực hiện được)
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Body**:
  ```json
  {
    "name": "Admin Mới",
    "email": "admin.new@example.com",
    "password": "password123"
  }
  ```
- **Phản hồi**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "60d21b4667d0d8992e610c86",
      "name": "Admin Mới",
      "email": "admin.new@example.com"
    }
  }
  ```

## Phần thưởng (Prizes)

### Lấy danh sách phần thưởng (Public)
- **URL**: `/api/prizes`
- **Method**: `GET`
- **Phản hồi**:
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "_id": "60d21b4667d0d8992e610c87",
        "name": "Phần quà 50.000đ",
        "description": "Phiếu quà tặng 50.000đ",
        "imageUrl": "https://example.com/images/gift.png",
        "probability": 10,
        "remainingQuantity": 20,
        "originalQuantity": 20,
        "active": true,
        "createdAt": "2023-05-17T12:00:00.000Z"
      },
      // ... các phần thưởng khác
    ]
  }
  ```

### Lấy chi tiết phần thưởng
- **URL**: `/api/prizes/:id`
- **Method**: `GET`
- **Params**: 
  - `id`: ID của phần thưởng
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c87",
      "name": "Phần quà 50.000đ",
      "description": "Phiếu quà tặng 50.000đ",
      "imageUrl": "https://example.com/images/gift.png",
      "probability": 10,
      "remainingQuantity": 20,
      "originalQuantity": 20,
      "active": true,
      "createdAt": "2023-05-17T12:00:00.000Z"
    }
  }
  ```

### Lấy tất cả phần thưởng (cả không active) - Admin
- **URL**: `/api/prizes/admin/all`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Phản hồi**:
  ```json
  {
    "success": true,
    "count": 5,
    "data": [
      // Tất cả phần thưởng bao gồm cả những phần không active
    ]
  }
  ```

### Tạo phần thưởng mới - Admin
- **URL**: `/api/prizes`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Body**:
  ```json
  {
    "name": "Phần quà 100.000đ",
    "description": "Phiếu quà tặng 100.000đ",
    "imageUrl": "https://example.com/images/gift100k.png",
    "probability": 5,
    "originalQuantity": 10
  }
  ```
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "Phần quà 100.000đ",
      "description": "Phiếu quà tặng 100.000đ",
      "imageUrl": "https://example.com/images/gift100k.png",
      "probability": 5,
      "remainingQuantity": 10,
      "originalQuantity": 10,
      "active": true,
      "createdAt": "2023-05-17T12:05:00.000Z"
    }
  }
  ```

### Cập nhật phần thưởng - Admin
- **URL**: `/api/prizes/:id`
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Params**: 
  - `id`: ID của phần thưởng
- **Body**:
  ```json
  {
    "name": "Phần quà 100.000đ - Đã cập nhật",
    "probability": 3,
    "originalQuantity": 15,
    "active": true
  }
  ```
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "Phần quà 100.000đ - Đã cập nhật",
      "description": "Phiếu quà tặng 100.000đ",
      "imageUrl": "https://example.com/images/gift100k.png",
      "probability": 3,
      "remainingQuantity": 15,
      "originalQuantity": 15,
      "active": true,
      "createdAt": "2023-05-17T12:05:00.000Z"
    }
  }
  ```

### Xóa phần thưởng - Admin
- **URL**: `/api/prizes/:id`
- **Method**: `DELETE`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Params**: 
  - `id`: ID của phần thưởng
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {}
  }
  ```

## Người dùng (Users)

### Kiểm tra thông tin người dùng
- **URL**: `/api/users/check`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "phone": "0987654321"
  }
  ```
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "exists": true,
      "user": {
        "_id": "60d21b4667d0d8992e610c89",
        "name": "Nguyễn Văn A",
        "email": "user@example.com",
        "phone": "0987654321",
        "spinsToday": 2,
        "lastSpinDate": "2023-05-17T12:30:00.000Z",
        "createdAt": "2023-05-17T12:10:00.000Z"
      }
    }
  }
  ```

### Tạo hoặc cập nhật người dùng
- **URL**: `/api/users`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0987654321"
  }
  ```
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "60d21b4667d0d8992e610c89",
      "name": "Nguyễn Văn A",
      "email": "user@example.com",
      "phone": "0987654321",
      "spinsToday": 0,
      "lastSpinDate": "2023-05-17T12:10:00.000Z",
      "createdAt": "2023-05-17T12:10:00.000Z"
    }
  }
  ```

### Lấy danh sách người dùng - Admin
- **URL**: `/api/users`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Phản hồi**:
  ```json
  {
    "success": true,
    "count": 50,
    "data": [
      {
        "_id": "60d21b4667d0d8992e610c89",
        "name": "Nguyễn Văn A",
        "email": "user@example.com",
        "phone": "0987654321",
        "spinsToday": 2,
        "lastSpinDate": "2023-05-17T12:30:00.000Z",
        "createdAt": "2023-05-17T12:10:00.000Z"
      },
      // ... các người dùng khác
    ]
  }
  ```

### Lấy thông tin người dùng cụ thể - Admin
- **URL**: `/api/users/:id`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Params**: 
  - `id`: ID của người dùng
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "_id": "60d21b4667d0d8992e610c89",
        "name": "Nguyễn Văn A",
        "email": "user@example.com",
        "phone": "0987654321",
        "spinsToday": 2,
        "lastSpinDate": "2023-05-17T12:30:00.000Z",
        "createdAt": "2023-05-17T12:10:00.000Z"
      },
      "spins": [
        // Lịch sử quay của người dùng này
      ]
    }
  }
  ```

### Xuất dữ liệu người dùng - Admin
- **URL**: `/api/users/export`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "60d21b4667d0d8992e610c89",
        "name": "Nguyễn Văn A",
        "email": "user@example.com",
        "phone": "0987654321",
        "spinsToday": 2,
        "lastSpinDate": "2023-05-17T12:30:00.000Z",
        "createdAt": "2023-05-17T12:10:00.000Z"
      },
      // ... các người dùng khác
    ]
  }
  ```

## Vòng quay (Spins)

### Quay thưởng
- **URL**: `/api/spins`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "userId": "60d21b4667d0d8992e610c89"
  }
  ```
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "spin": {
        "_id": "60d21b4667d0d8992e610c8a",
        "user": "60d21b4667d0d8992e610c89",
        "prize": {
          "_id": "60d21b4667d0d8992e610c87",
          "name": "Phần quà 50.000đ",
          "imageUrl": "https://example.com/images/gift.png",
          // ... thông tin khác về phần thưởng
        },
        "isWin": true,
        "createdAt": "2023-05-17T12:30:00.000Z"
      },
      "isWin": true,
      "remainingSpins": 3
    }
  }
  ```

### Lấy lịch sử quay của một người dùng
- **URL**: `/api/spins/user/:userId`
- **Method**: `GET`
- **Params**: 
  - `userId`: ID của người dùng
- **Phản hồi**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": {
      "spins": [
        {
          "_id": "60d21b4667d0d8992e610c8a",
          "user": "60d21b4667d0d8992e610c89",
          "prize": {
            "_id": "60d21b4667d0d8992e610c87",
            "name": "Phần quà 50.000đ",
            // ... thông tin khác về phần thưởng
          },
          "isWin": true,
          "createdAt": "2023-05-17T12:30:00.000Z"
        },
        // ... lịch sử quay khác
      ],
      "remainingSpins": 3
    }
  }
  ```

### Lấy tất cả lịch sử quay - Admin
- **URL**: `/api/spins`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Query**: 
  - `startDate` (không bắt buộc): Ngày bắt đầu (YYYY-MM-DD)
  - `endDate` (không bắt buộc): Ngày kết thúc (YYYY-MM-DD)
- **Phản hồi**:
  ```json
  {
    "success": true,
    "count": 100,
    "data": [
      {
        "_id": "60d21b4667d0d8992e610c8a",
        "user": {
          "_id": "60d21b4667d0d8992e610c89",
          "name": "Nguyễn Văn A",
          "email": "user@example.com",
          "phone": "0987654321"
        },
        "prize": {
          "_id": "60d21b4667d0d8992e610c87",
          "name": "Phần quà 50.000đ"
        },
        "isWin": true,
        "createdAt": "2023-05-17T12:30:00.000Z"
      },
      // ... lịch sử quay khác
    ]
  }
  ```

### Lấy thống kê vòng quay - Admin
- **URL**: `/api/spins/stats`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer YOUR_TOKEN`
- **Query**: 
  - `startDate` (không bắt buộc): Ngày bắt đầu (YYYY-MM-DD)
  - `endDate` (không bắt buộc): Ngày kết thúc (YYYY-MM-DD)
- **Phản hồi**:
  ```json
  {
    "success": true,
    "data": {
      "totalSpins": 250,
      "totalWins": 75,
      "uniqueUsersCount": 120,
      "winRate": "30.00",
      "prizeStats": [
        {
          "_id": "60d21b4667d0d8992e610c87",
          "count": 50,
          "name": "Phần quà 50.000đ",
          "originalQuantity": 100,
          "remainingQuantity": 50
        },
        // ... thống kê các phần thưởng khác
      ]
    }
  }
  ``` 