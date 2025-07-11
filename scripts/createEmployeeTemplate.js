const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Tạo workbook mới
const wb = xlsx.utils.book_new();

// Dữ liệu mẫu
const data = [
  {
    "Mã nhân viên": 'NV001',
    "Họ tên": 'Nguyễn Văn A',
    "Email": 'nguyenvana@example.com',
    "Số điện thoại": '0901234567',
    "Mã cửa hàng": 'SHOP01',
    "Địa chỉ": 'Hà Nội',
    "Số máy bán được": 5
  },
  {
    "Mã nhân viên": 'NV002',
    "Họ tên": 'Trần Thị B',
    "Email": 'tranthib@example.com',
    "Số điện thoại": '0912345678',
    "Mã cửa hàng": 'SHOP02',
    "Địa chỉ": 'TP HCM',
    "Số máy bán được": 10
  },
  {
    "Mã nhân viên": 'NV003',
    "Họ tên": 'Lê Văn C',
    "Email": 'levanc@example.com',
    "Số điện thoại": '0923456789',
    "Mã cửa hàng": 'SHOP03',
    "Địa chỉ": 'Đà Nẵng',
    "Số máy bán được": 3
  }
];

// Tạo worksheet từ dữ liệu
const ws = xlsx.utils.json_to_sheet(data);

// Thêm worksheet vào workbook
xlsx.utils.book_append_sheet(wb, ws, 'Nhân viên');

// Đảm bảo thư mục tồn tại
const templateDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}

// Lưu workbook vào file
const filename = path.join(templateDir, 'mau_nhap_nhan_vien.xlsx');
xlsx.writeFile(wb, filename);

console.log(`File mẫu đã được tạo tại: ${filename}`); 