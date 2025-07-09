# Tài liệu API Vòng quay may mắn (v4 - Chuỗi Phần thưởng Ngẫu nhiên)

Tài liệu này mô tả kiến trúc API mới nhất, được thiết kế để tăng sự hấp dẫn và khó đoán cho người chơi bằng cách sử dụng một chuỗi phần thưởng được tạo sẵn và xáo trộn.

## I. Tổng quan về Nghiệp vụ Cốt lõi

### 1. Gói Lượt Quay Động

Số lượt quay của nhân viên được **tự động tính toán** dựa trên `số máy bán được`:

- **1-4 máy:** Cấp **1 lượt quay**.
- **5-9 máy:** Cấp **3 lượt quay**.
- **>= 10 máy:** Cấp **6 lượt quay**.

Ngoài ra, Admin có thể **tùy chỉnh số lượt quay** cho từng nhân viên thông qua API `PUT /api/employees/:id` hoặc khi import dữ liệu nhân viên từ Excel. **Số lượt quay tùy chỉnh sẽ được ưu tiên hơn số lượt quay được tính từ số máy bán.**

### 2. Hệ thống "Hộp Quà Định Sẵn" (Pre-generated Loot Box)

Đây là thay đổi cốt lõi. Thay vì quyết định Bậc giải thưởng một cách cố định tại thời điểm quay, hệ thống sẽ **tạo ra trước một chuỗi các Bậc giải thưởng** cho mỗi nhân viên ngay khi họ đủ điều kiện nhận gói lượt quay.

#### Cơ chế tạo chuỗi (`spinTierSequence`):

- **Khi nhân viên được tạo hoặc được nâng cấp gói,** một chuỗi các Bậc sẽ được tạo và lưu lại:
  - **Gói 1 lượt:** Chuỗi là `[1]`.
  - **Gói 3 lượt:** Chuỗi là `[1, 2, 2]` (Cố định: 1 giải thường, 2 giải khá).
  - **Gói 6 lượt:** Hệ thống lấy bộ `[1, 1, 1, 1, 2, 3]` và **xáo trộn (shuffle)** nó để tạo ra một chuỗi ngẫu nhiên.
  - **Gói tùy chỉnh:** Đối với các gói có số lượt quay khác (2, 4, 5, 7, ...), hệ thống sẽ tạo chuỗi bậc giải thưởng theo tỉ lệ:
    - 70% giải Bậc 1 (giải thường)
    - 20% giải Bậc 2 (giải khá)
    - 10% giải Bậc 3 (giải đặc biệt), tối thiểu 1 giải nếu tổng số lượt quay >= 4
    - Chuỗi này cũng được xáo trộn để tạo tính ngẫu nhiên

#### Luồng hoạt động khi quay:

1. Khi nhân viên quay, hệ thống lấy `spinsUsed` làm chỉ mục (index).
2. Hệ thống đọc Bậc giải thưởng tại vị trí đó trong chuỗi `spinTierSequence`.
3. Hệ thống tiến hành quay trong nhóm giải thưởng có Bậc tương ứng.

> **Ưu điểm:** Nhân viên không thể đoán trước được lượt nào sẽ ra giải đặc biệt, tạo sự hồi hộp trong mỗi lần quay. Tuy nhiên, vẫn đảm bảo tính công bằng rằng mỗi người trong gói 6 lượt đều nhận đủ 1 giải Bậc 3, 1 giải Bậc 2 và 4 giải Bậc 1.

---

## II. API Nhân viên (Employee APIs)

### 1. Tạo nhân viên mới

- **Endpoint:** `POST /api/employees`
- **Mô tả:** Tạo một hồ sơ nhân viên mới. Một chuỗi phần thưởng (`spinTierSequence`) sẽ được tự động tạo.
- **Quyền truy cập:** Admin
- **Tham số đầu vào (Request Body):**
  ```json
  {
    "employeeCode": "NV002",
    "name": "Trần Thị Bích",
    "email": "bich.tt@example.com",
    "phone": "0987654321",
    "codeShop": "SHOP02",
    "address": "123 Đường ABC, Quận 1, TP. HCM",
    "machinesSold": 11
  }
  ```
- **Phản hồi thành công (Success Response - 201 Created):**
  *Hệ thống tạo ra một chuỗi 6 Bậc đã được xáo trộn.*
  ```json
  {
      "_id": "...",
      "employeeCode": "NV002",
      "name": "Trần Thị Bích",
      "email": "bich.tt@example.com",
      "phone": "0987654321",
      "codeShop": "SHOP02",
      "address": "123 Đường ABC, Quận 1, TP. HCM",
      "machinesSold": 11,
      "spinsUsed": 0,
      "spinTierSequence": [1, 3, 1, 2, 1, 1],
      "totalSpins": 6,
      "remainingSpins": 6
  }
  ```

### 2. Cập nhật thông tin nhân viên

- **Endpoint:** `PUT /api/employees/:id`
- **Mô tả:** Cập nhật thông tin nhân viên. Hệ thống xử lý theo thứ tự ưu tiên:
  1. Cập nhật thông tin cơ bản (name, email, phone, codeShop, address)
  2. Cập nhật machinesSold và tính toán số lượt quay mặc định
  3. Nếu có totalSpins, sử dụng giá trị này thay vì số lượt quay mặc định
  4. Nếu có spinsUsed, cập nhật số lượt đã sử dụng
- **Quyền truy cập:** Admin
- **Tham số đầu vào (Request Body):**
  ```json
  {
    "name": "Trần Thị Bích (Updated)",
    "email": "bich.tt@example.com",
    "phone": "0987654321",
    "codeShop": "SHOP02",
    "address": "123 Đường ABC, Quận 1, TP. HCM",
    "machinesSold": 15,
    "totalSpins": 10,  // Tùy chọn: Ghi đè số lượt quay mặc định
    "spinsUsed": 0     // Tùy chọn: Cập nhật số lượt đã sử dụng
  }
  ```
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  shuffle{
      "_id": "...",
      "employeeCode": "NV002",
      "name": "Trần Thị Bích (Updated)",
      "email": "bich.tt@example.com",
      "phone": "0987654321",
      "codeShop": "SHOP02",
      "address": "123 Đường ABC, Quận 1, TP. HCM",
      "machinesSold": 15,
      "spinsUsed": 0,
      "spinTierSequence": [...],
      "totalSpins": 10,  // Số lượt quay tùy chỉnh
      "remainingSpins": 10  // Giá trị được tính toán: totalSpins - spinsUsed
  }
  ```
- **Lưu ý quan trọng:**
  - Tất cả các trường đều là tùy chọn, chỉ cập nhật các trường được gửi trong request
  - Nếu chỉ cập nhật `machinesSold`, hệ thống sẽ tính lại số lượt quay dựa trên số máy bán mới
  - Nếu cập nhật `totalSpins`, hệ thống sẽ sử dụng giá trị này làm số lượt quay cuối cùng, bỏ qua việc tính toán từ `machinesSold`
  - Nếu cập nhật cả `machinesSold` và `totalSpins`, hệ thống sẽ ưu tiên sử dụng `totalSpins`
  - Trường `remainingSpins` trong phản hồi là giá trị được tính toán (không phải tham số đầu vào)
  - Khi cập nhật số lượt quay (`totalSpins`), hệ thống sẽ xử lý `spinsUsed` theo các quy tắc sau:
    - Nếu số lượt quay mới > số lượt quay cũ: Reset `spinsUsed` về 0
    - Nếu số lượt quay mới <= số lượt đã sử dụng: Giới hạn `spinsUsed` bằng với số lượt quay mới

### 3. Import nhân viên từ Excel

- **Endpoint:** `POST /api/employees/import`
- **Mô tả:** Nhập danh sách nhân viên từ file Excel. Hệ thống sẽ tự động tạo mới hoặc cập nhật nhân viên hiện có.
- **Quyền truy cập:** Admin
- **Content-Type:** `multipart/form-data`
- **Tham số đầu vào:**
  - `file`: File Excel chứa danh sách nhân viên (định dạng .xlsx)
- **Định dạng file Excel:**
  File Excel phải có các cột sau (tiếng Việt):
  - `Mã nhân viên` (bắt buộc)
  - `Họ tên` (bắt buộc)
  - `Email` (bắt buộc)
  - `Số điện thoại` (tùy chọn)
  - `Mã cửa hàng` (tùy chọn)
  - `Địa chỉ` (tùy chọn)
  - `Số máy bán được` (tùy chọn, mặc định là 0)
  - `Số lượt quay` (tùy chọn, chỉ áp dụng khi cập nhật nhân viên)
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "success": true,
      "message": "Đã xử lý 50 nhân viên: Tạo mới 30, Cập nhật 18, Lỗi 2",
      "results": {
          "total": 50,
          "created": 30,
          "updated": 18,
          "failed": 2,
          "errors": [
              "Dòng thiếu thông tin bắt buộc: {...}",
              "Lỗi xử lý dòng: {...} - Email không hợp lệ"
          ]
      }
  }
  ```
- **Lưu ý:**
  - Có thể tải xuống file mẫu từ `/public/templates/mau_nhap_nhan_vien.xlsx`
  - Nếu nhân viên đã tồn tại (trùng mã hoặc email), thông tin sẽ được cập nhật
  - Nếu `machinesSold` được cập nhật và dẫn đến tăng số lượt quay, `spinsUsed` sẽ được reset về 0 và chuỗi bậc giải thưởng sẽ được tạo lại
  - Trường `Số lượt quay` chỉ được áp dụng khi cập nhật nhân viên đã tồn tại, không áp dụng khi tạo mới
  - Khi cập nhật nhân viên, nếu cung cấp cả `Số máy bán được` và `Số lượt quay`, hệ thống sẽ ưu tiên sử dụng `Số lượt quay` tùy chỉnh
  - Khi cập nhật số lượt quay, hệ thống sẽ áp dụng các quy tắc xử lý tương tự như API cập nhật nhân viên

### 4. Lấy danh sách nhân viên

- **Endpoint:** `GET /api/employees`
- **Mô tả:** Lấy danh sách tất cả nhân viên.
- **Quyền truy cập:** Admin
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  [
      {
          "_id": "...",
          "employeeCode": "NV001",
          "name": "Nguyễn Văn A",
          "email": "a.nv@example.com",
          "phone": "0901234567",
          "codeShop": "SHOP01",
          "address": "Hà Nội",
          "machinesSold": 5,
          "spinsUsed": 1,
          "totalSpins": 3,
          "remainingSpins": 2
      },
      // ...
  ]
  ```

### 5. Lấy thông tin nhân viên theo ID

- **Endpoint:** `GET /api/employees/:id`
- **Mô tả:** Lấy thông tin chi tiết của một nhân viên.
- **Quyền truy cập:** Admin
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "_id": "...",
      "employeeCode": "NV001",
      "name": "Nguyễn Văn A",
      "email": "a.nv@example.com",
      "phone": "0901234567",
      "codeShop": "SHOP01",
      "address": "Hà Nội",
      "machinesSold": 5,
      "spinsUsed": 1,
      "spinTierSequence": [1, 2, 2],
      "totalSpins": 3,
      "remainingSpins": 2
  }
  ```

### 6. Xác minh nhân viên theo mã

- **Endpoint:** `GET /api/employees/verify/:employeeCode`
- **Mô tả:** Xác minh thông tin nhân viên dựa trên mã nhân viên.
- **Quyền truy cập:** Public
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "exists": true,
      "employee": {
          "name": "Nguyễn Văn A",
          "email": "a.nv@example.com",
          "phone": "0901234567",
          "codeShop": "SHOP01",
          "address": "Hà Nội",
          "remainingSpins": 2,
          "machinesSold": 5
      }
  }
  ```
- **Phản hồi khi không tìm thấy (Not Found - 404):**
  ```json
  {
      "exists": false,
      "message": "Mã nhân viên không tồn tại"
  }
  ```

### 7. Xóa nhân viên

- **Endpoint:** `DELETE /api/employees/:id`
- **Mô tả:** Xóa một nhân viên khỏi hệ thống.
- **Quyền truy cập:** Admin
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "message": "Nhân viên đã được xóa"
  }
  ```

---

## III. API Quay thưởng (Spin APIs)

### 1. Nhân viên quay thưởng

- **Endpoint:** `POST /api/spins/employee`
- **Mô tả:** Cho phép nhân viên quay thưởng dựa trên mã nhân viên. Hệ thống sẽ kiểm tra số lượt quay còn lại và xác định giải thưởng dựa trên chuỗi bậc giải thưởng đã được tạo sẵn.
- **Quyền truy cập:** Public
- **Tham số đầu vào (Request Body):**
  ```json
  {
      "employeeCode": "NV001"
  }
  ```
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "success": true,
      "data": {
          "spin": {
              "_id": "...",
              "employee": "...",
              "prize": {
                  "_id": "...",
                  "name": "Voucher 500.000đ",
                  "description": "Voucher mua sắm trị giá 500.000đ",
                  "tier": 2,
                  "probability": 20,
                  "isRealPrize": true,
                  "originalQuantity": 100,
                  "remainingQuantity": 99,
                  "active": true
              },
              "isWin": true,
              "createdAt": "2023-06-15T08:30:45.123Z",
              "updatedAt": "2023-06-15T08:30:45.123Z"
          },
          "isWin": true,
          "remainingSpins": 1
      }
  }
  ```

### 2. Lấy lịch sử quay của nhân viên

- **Endpoint:** `GET /api/spins/employee/:employeeId`
- **Mô tả:** Lấy lịch sử quay thưởng của một nhân viên.
- **Quyền truy cập:** Admin
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "success": true,
      "pagination": {
          "page": 1,
          "limit": 10,
          "totalItems": 2,
          "totalPages": 1
      },
      "data": {
          "spins": [
              {
                  "_id": "...",
                  "employee": {
                      "_id": "...",
                      "name": "Nguyễn Văn A",
                      "email": "a.nv@example.com",
                      "phone": "0901234567",
                      "codeShop": "SHOP01"
                  },
                  "prize": {
                      "_id": "...",
                      "name": "Voucher 500.000đ",
                      "description": "Voucher mua sắm trị giá 500.000đ",
                      "tier": 2
                  },
                  "isWin": true,
                  "createdAt": "2023-06-15T08:30:45.123Z"
              },
              // ...
          ],
          "employee": {
              "name": "Nguyễn Văn A",
              "email": "a.nv@example.com",
              "phone": "0901234567",
              "codeShop": "SHOP01",
              "remainingSpins": 1
          }
      }
  }
  ```

---

## IV. API Giải thưởng (Prize APIs)

### 1. Tạo giải thưởng mới

- **Endpoint:** `POST /api/prizes`
- **Mô tả:** Tạo một giải thưởng mới trong hệ thống.
- **Quyền truy cập:** Admin
- **Tham số đầu vào (Request Body):**
  ```json
  {
      "name": "iPhone 14 Pro",
      "description": "Điện thoại iPhone 14 Pro 128GB",
      "tier": 3,
      "probability": 5,
      "isRealPrize": true,
      "originalQuantity": 10,
      "remainingQuantity": 10,
      "active": true
  }
  ```
- **Phản hồi thành công (Success Response - 201 Created):**
  ```json
  {
      "_id": "...",
      "name": "iPhone 14 Pro",
      "description": "Điện thoại iPhone 14 Pro 128GB",
      "tier": 3,
      "probability": 5,
      "isRealPrize": true,
      "originalQuantity": 10,
      "remainingQuantity": 10,
      "active": true,
      "createdAt": "2023-06-15T07:00:00.000Z",
      "updatedAt": "2023-06-15T07:00:00.000Z"
  }
  ```

### 2. Lấy danh sách giải thưởng

- **Endpoint:** `GET /api/prizes`
- **Mô tả:** Lấy danh sách tất cả giải thưởng trong hệ thống.
- **Quyền truy cập:** Admin
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  [
      {
          "_id": "...",
          "name": "iPhone 14 Pro",
          "description": "Điện thoại iPhone 14 Pro 128GB",
          "tier": 3,
          "probability": 5,
          "isRealPrize": true,
          "originalQuantity": 10,
          "remainingQuantity": 8,
          "active": true,
          "createdAt": "2023-06-15T07:00:00.000Z",
          "updatedAt": "2023-06-15T07:00:00.000Z"
      },
      // ...
  ]
  ```

### 3. Cập nhật giải thưởng

- **Endpoint:** `PUT /api/prizes/:id`
- **Mô tả:** Cập nhật thông tin của một giải thưởng.
- **Quyền truy cập:** Admin
- **Tham số đầu vào (Request Body):**
  ```json
  {
      "name": "iPhone 14 Pro Max",
      "description": "Điện thoại iPhone 14 Pro Max 256GB",
      "probability": 3,
      "remainingQuantity": 15,
      "active": true
  }
  ```
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "_id": "...",
      "name": "iPhone 14 Pro Max",
      "description": "Điện thoại iPhone 14 Pro Max 256GB",
      "tier": 3,
      "probability": 3,
      "isRealPrize": true,
      "originalQuantity": 10,
      "remainingQuantity": 15,
      "active": true,
      "createdAt": "2023-06-15T07:00:00.000Z",
      "updatedAt": "2023-06-15T08:30:00.000Z"
  }
  ```

---

## V. API Thống kê (Statistics APIs)

### 1. Thống kê quay thưởng

- **Endpoint:** `GET /api/spins/stats`
- **Mô tả:** Lấy thống kê về các lượt quay thưởng trong hệ thống.
- **Quyền truy cập:** Admin
- **Tham số truy vấn (Query Parameters):**
  - `startDate`: Ngày bắt đầu (định dạng YYYY-MM-DD)
  - `endDate`: Ngày kết thúc (định dạng YYYY-MM-DD)
- **Phản hồi thành công (Success Response - 200 OK):**
  ```json
  {
      "success": true,
      "data": {
          "totalSpins": 1500,
          "totalWins": 350,
          "uniqueUsersCount": 120,
          "winRate": "23.33",
          "prizeStats": [
              {
                  "_id": "...",
                  "count": 5,
                  "name": "iPhone 14 Pro",
                  "originalQuantity": 10,
                  "remainingQuantity": 5
              },
              // ...
          ]
      }
  }
  ```
