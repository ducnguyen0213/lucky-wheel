# Tài liệu API Vòng quay may mắn (v4 - Chuỗi Phần thưởng Ngẫu nhiên)

Tài liệu này mô tả kiến trúc API mới nhất, được thiết kế để tăng sự hấp dẫn và khó đoán cho người chơi bằng cách sử dụng một chuỗi phần thưởng được tạo sẵn và xáo trộn.

## I. Tổng quan về Nghiệp vụ Cốt lõi

### 1. Gói Lượt Quay Động
Số lượt quay của nhân viên vẫn được **tự động tính toán** dựa trên `số máy bán được`:

-   **1-4 máy:** Cấp **1 lượt quay**.
-   **5-9 máy:** Cấp **3 lượt quay**.
-   **>= 10 máy:** Cấp **6 lượt quay**.

### 2. Hệ thống "Hộp Quà Định Sẵn" (Pre-generated Loot Box)
Đây là thay đổi cốt lõi. Thay vì quyết định Bậc giải thưởng một cách cố định tại thời điểm quay, hệ thống sẽ **tạo ra trước một chuỗi các Bậc giải thưởng** cho mỗi nhân viên ngay khi họ đủ điều kiện nhận gói lượt quay.

#### Cơ chế tạo chuỗi (`spinTierSequence`):
-   **Khi nhân viên được tạo hoặc được nâng cấp gói,** một chuỗi các Bậc sẽ được tạo và lưu lại:
    -   **Gói 1 lượt:** Chuỗi là `[1]`.
    -   **Gói 3 lượt:** Chuỗi là `[1, 2, 2]` (Cố định: 1 giải thường, 2 giải khá).
    -   **Gói 6 lượt:** Hệ thống lấy bộ `[1, 1, 1, 1, 2, 3]` và **xáo trộn (shuffle)** nó để tạo ra một chuỗi ngẫu nhiên.

#### Luồng hoạt động khi quay:
1.  Khi nhân viên quay, hệ thống lấy `spinsUsed` làm chỉ mục (index).
2.  Hệ thống đọc Bậc giải thưởng tại vị trí đó trong chuỗi `spinTierSequence`.
3.  Hệ thống tiến hành quay trong nhóm giải thưởng có Bậc tương ứng.

> **Ưu điểm:** Nhân viên không thể đoán trước được lượt nào sẽ ra giải đặc biệt, tạo sự hồi hộp trong mỗi lần quay. Tuy nhiên, vẫn đảm bảo tính công bằng rằng mỗi người trong gói 6 lượt đều nhận đủ 1 giải Bậc 3, 1 giải Bậc 2 và 4 giải Bậc 1.

---

## II. API Nhân viên (Employee APIs)

### 1. Tạo nhân viên mới
-   **Endpoint:** `POST /api/employees`
-   **Mô tả:** Tạo một hồ sơ nhân viên mới. Một chuỗi phần thưởng (`spinTierSequence`) sẽ được tự động tạo.
-   **Quyền truy cập:** Admin
-   **Tham số đầu vào (Request Body):**
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
-   **Phản hồi thành công (Success Response - 201 Created):**
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
-   **Endpoint:** `PUT /api/employees/:id`
-   **Mô tả:** Cập nhật thông tin nhân viên. Nếu việc tăng `machinesSold` dẫn đến nâng cấp gói lượt quay, `spinsUsed` sẽ được reset và một chuỗi mới sẽ được tạo.
-   **Quyền truy cập:** Admin
-   **Tham số đầu vào (Request Body):**
    *Tất cả các trường đều là tùy chọn.*
    ```json
    {
      "name": "Trần Thị Bích Lan",
      "email": "bich.lan.tt@example.com",
      "phone": "0987654322",
      "codeShop": "SHOP03",
      "address": "456 Đường XYZ, Quận 2, TP. HCM",
      "machinesSold": 12
    }
    ```
-   **Phản hồi thành công (Success Response - 200 OK):**
    *Giả sử nhân viên được cập nhật thông tin và được nâng cấp gói lượt quay.*
    ```json
    {
        "_id": "...",
        "employeeCode": "NV002",
        "name": "Trần Thị Bích Lan",
        "email": "bich.lan.tt@example.com",
        "phone": "0987654322",
        "codeShop": "SHOP03",
        "address": "456 Đường XYZ, Quận 2, TP. HCM",
        "machinesSold": 12,
        "spinsUsed": 0,
        "spinTierSequence": [2, 1, 1, 1, 3, 1],
        "totalSpins": 6,
        "remainingSpins": 6
    }
    ```

### 3. Lấy danh sách nhân viên
-   **Endpoint:** `GET /api/employees`
-   **Phản hồi thành công (Success Response - 200 OK):**
    ```json
    [
        {
            "_id": "...",
            "employeeCode": "NV002",
            "name": "Trần Thị Bích",
            "email": "bich.tt@example.com",
            "phone": "0987654321",
            "codeShop": "SHOP02",
            "address": "123 Đường ABC, Quận 1, TP. HCM",
            "machinesSold": 11,
            "spinsUsed": 2,
            "spinTierSequence": [1, 3, 1, 2, 1, 1],
            "totalSpins": 6,
            "remainingSpins": 4
        }
    ]
    ```

### 4. Xác minh thông tin nhân viên (Lấy thông tin để quay)
-   **Endpoint:** `GET /api/employees/verify/:employeeCode`
-   **Mô tả:** Lấy thông tin cần thiết của một nhân viên dựa trên mã nhân viên. API này thường được gọi trước khi hiển thị giao diện vòng quay để xác nhận nhân viên và số lượt quay còn lại của họ.
-   **Quyền truy cập:** Public
-   **Tham số đường dẫn (URL Parameter):**
    - `employeeCode` (bắt buộc): Mã của nhân viên cần xác minh.
-   **Phản hồi thành công (Success Response - 200 OK):**
    ```json
    {
        "exists": true,
        "employee": {
            "name": "Trần Thị Bích",
            "email": "bich.tt@example.com",
            "phone": "0987654321",
            "codeShop": "SHOP02",
            "address": "123 Đường ABC, Quận 1, TP. HCM",
            "remainingSpins": 4,
            "machinesSold": 11
        }
    }
    ```
-   **Phản hồi lỗi (Error Response - 404 Not Found):**
    ```json
    {
        "exists": false,
        "message": "Mã nhân viên không tồn tại"
    }
    ```

---

## III. API Giải thưởng (Prize APIs)

### 1. Tạo giải thưởng mới
-   **Endpoint:** `POST /api/prizes`
-   **Mô tả:** Tạo một giải thưởng mới và gán nó vào một Bậc.
-   **Quyền truy cập:** Admin
-   **Tham số đầu vào (Request Body):**
    ```json
    {
      "name": "iPhone 15 Pro Max",
      "description": "Giải thưởng cao nhất",
      "probability": 60,
      "tier": 3,
      "originalQuantity": 5
    }
    ```
-   **Phản hồi thành công (Success Response - 201 Created):**
    ```json
    {
        "success": true,
        "data": {
            "_id": "...",
            "name": "iPhone 15 Pro Max",
            "probability": 60,
            "tier": 3,
            "originalQuantity": 5,
            "remainingQuantity": 5
        }
    }
    ```

### 2. Cập nhật giải thưởng
-   **Endpoint:** `PUT /api/prizes/:id`
-   **Quyền truy cập:** Admin
-   **Tham số đầu vào (Tùy chọn):**
    ```json
    {
      "probability": 70,
      "active": false
    }
    ```

---

## IV. API Lượt quay (Spin API)

### 1. Thực hiện quay thưởng cho nhân viên
-   **Endpoint:** `POST /api/spins/employee`
-   **Mô tả:** API cốt lõi để thực hiện một lượt quay cho nhân viên. Chỉ cần gửi `employeeCode`, hệ thống sẽ tự động kiểm tra lượt quay, xác định bậc giải thưởng, chọn quà và trả về kết quả.
-   **Quyền truy cập:** Public
-   **Tham số đầu vào (Request Body):**
    ```json
    {
      "employeeCode": "NV001"
    }
    ```
-   **Phản hồi thành công (Success Response - 200 OK):**
    *Nhân viên quay trúng giải "iPhone 15 Pro Max" và còn lại 5 lượt quay.*
    ```json
    {
        "success": true,
        "data": {
            "spin": {
                "_id": "63c8b...",
                "employee": "63c8a...",
                "prize": {
                    "_id": "63c8a...",
                    "name": "iPhone 15 Pro Max",
                    "tier": 3
                },
                "isWin": true,
                "createdAt": "2023-01-19T..."
            },
            "isWin": true,
            "remainingSpins": 5
        }
    }
    ```
-   **Phản hồi lỗi (Error Response):**
    -   `400 Bad Request`: `{"success": false, "message": "Vui lòng cung cấp mã nhân viên"}`
    -   `400 Bad Request`: `{"success": false, "message": "Bạn đã hết lượt quay"}`
    -   `404 Not Found`: `{"success": false, "message": "Mã nhân viên không hợp lệ"}`
    -   `404 Not Found`: `{"success": false, "message": "Hiện không có giải thưởng nào cho Bậc X. Vui lòng thử lại sau."}`
    -   `500 Internal Server Error`: `{"success": false, "message": "Lỗi hệ thống: ..."}` 