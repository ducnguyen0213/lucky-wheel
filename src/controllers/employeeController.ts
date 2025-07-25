import { Request, Response } from 'express';
import Employee from '../models/Employee';
import asyncHandler from 'express-async-handler';
import xlsx from 'xlsx';
import { PaginatedRequest, getPaginationInfo } from '../middleware/paginate';

// --- Helper Functions ---

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const generateSpinSequence = (totalSpins: number): number[] => {
    if (totalSpins === 1) return [1];
    if (totalSpins === 3) return [1, 2, 2]; // Fixed sequence for 3 spins
    if (totalSpins === 6) {
        const baseSequence = [1, 1, 1, 1, 2, 3];
        return shuffleArray(baseSequence);
    }
    
    // Xử lý các trường hợp số lượt quay khác
    if (totalSpins > 0) {
        // Tạo một chuỗi tùy chỉnh dựa trên số lượt quay
        const customSequence = [];
        
        // Phân bổ giải thưởng theo tỉ lệ:
        // - 10% giải bậc 3 (tối thiểu 1 nếu totalSpins >= 4)
        // - 20% giải bậc 2
        // - 70% giải bậc 1
        
        let tier3Count = Math.max(Math.floor(totalSpins * 0.1), totalSpins >= 4 ? 1 : 0);
        let tier2Count = Math.floor(totalSpins * 0.2);
        let tier1Count = totalSpins - tier3Count - tier2Count;
        
        // Đảm bảo có ít nhất 1 giải bậc 1
        if (tier1Count < 1 && totalSpins > 0) {
            tier1Count = 1;
            if (tier2Count > 0) tier2Count--;
            else if (tier3Count > 0) tier3Count--;
        }
        
        // Thêm các giải vào chuỗi
        for (let i = 0; i < tier1Count; i++) customSequence.push(1);
        for (let i = 0; i < tier2Count; i++) customSequence.push(2);
        for (let i = 0; i < tier3Count; i++) customSequence.push(3);
        
        // Xáo trộn chuỗi
        return shuffleArray(customSequence);
    }
    
    return [];
};

const calculateTotalSpins = (machinesSold: number): number => {
  if (machinesSold >= 10) return 6;
  if (machinesSold >= 5) return 3;
  if (machinesSold >= 1) return 1;
  return 0;
};

const formatEmployeeResponse = (employee: any) => {
    // Ưu tiên sử dụng totalSpins tùy chỉnh nếu có, nếu không thì tính dựa trên machinesSold
    const totalSpins = employee.totalSpins !== undefined ? employee.totalSpins : calculateTotalSpins(employee.machinesSold);
    const remainingSpins = totalSpins - employee.spinsUsed;
    const finalRemainingSpins = Math.max(0, remainingSpins);
    const employeeObj = employee.toObject ? employee.toObject() : employee;

    return {
        ...employeeObj,
        totalSpins,
        remainingSpins: finalRemainingSpins
    };
}

// Interface cho dữ liệu import
interface EmployeeImportRow {
  [key: string]: any;
  // Các trường tiếng Việt
  "Mã nhân viên"?: string;
  "Họ tên"?: string;
  "Email"?: string;
  "Số điện thoại"?: string;
  "Mã cửa hàng"?: string;
  "Địa chỉ"?: string;
  "Số máy bán được"?: number | string;
  "Số lượt quay"?: number | string;
}

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { employeeCode, name, email, phone, codeShop, address, machinesSold } = req.body;

  const employeeExists = await Employee.findOne({ $or: [{ employeeCode }, { email }] });

  if (employeeExists) {
    res.status(400);
    throw new Error('Mã nhân viên hoặc email đã tồn tại');
  }

  // Tính số lượt quay dựa trên số máy bán
  const totalSpins = calculateTotalSpins(machinesSold || 0);
  const spinTierSequence = generateSpinSequence(totalSpins);

  const employee = new Employee({
    employeeCode,
    name,
    email,
    phone,
    codeShop,
    address,
    machinesSold: machinesSold || 0,
    spinsUsed: 0,
    spinTierSequence,
  });

  const createdEmployee = await employee.save();
  res.status(201).json(formatEmployeeResponse(createdEmployee));
});

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = (req as PaginatedRequest).pagination;
  const {
    keyword,
    codeShop,
    machinesSold,
    totalSpins,
  } = req.query;

  const filterClauses: any[] = [];
  let sortOptions: any = { createdAt: -1 };

  // Tìm kiếm chung bằng keyword trên nhiều trường với $text
  if (keyword) {
    filterClauses.push({
        $text: { $search: String(keyword) }
    });
    // Sắp xếp theo mức độ liên quan khi có keyword
    sortOptions = { score: { $meta: 'textScore' } };
  }

  // Các bộ lọc riêng biệt sẽ được AND với bộ lọc keyword
  if (codeShop) filterClauses.push({ codeShop: { $regex: codeShop as string, $options: 'i' } });
  if (machinesSold) filterClauses.push({ machinesSold: Number(machinesSold) });

  // Xử lý logic tìm kiếm phức tạp cho totalSpins
  if (totalSpins) {
    const spins = Number(totalSpins);
    const orSpins: any[] = [{ totalSpins: spins }];

    const calculatedSpinsConditions: any = { totalSpins: { $in: [null, undefined] } };

    if (spins === 1) {
      calculatedSpinsConditions.machinesSold = { $gte: 1, $lt: 5 };
      orSpins.push(calculatedSpinsConditions);
    } else if (spins === 3) {
      calculatedSpinsConditions.machinesSold = { $gte: 5, $lt: 10 };
      orSpins.push(calculatedSpinsConditions);
    } else if (spins === 6) {
      calculatedSpinsConditions.machinesSold = { $gte: 10 };
      orSpins.push(calculatedSpinsConditions);
    } else if (spins === 0) {
      calculatedSpinsConditions.machinesSold = { $lt: 1 };
      orSpins.push(calculatedSpinsConditions);
    }
    
    filterClauses.push({ $or: orSpins });
  }

  const filter = filterClauses.length > 0 ? { $and: filterClauses } : {};

  const totalItems = await Employee.countDocuments(filter);
  const employees = await Employee.find(filter).sort(sortOptions).skip(skip).limit(limit);

  const paginationInfo = getPaginationInfo(totalItems, page, limit);
  const formattedEmployees = employees.map(formatEmployeeResponse);

  res.status(200).json({
    success: true,
    pagination: paginationInfo,
    data: formattedEmployees,
  });
});

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Private/Admin
const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findById(req.params.id);

  if (employee) {
    res.json(formatEmployeeResponse(employee));
  } else {
    res.status(404);
    throw new Error('Không tìm thấy nhân viên');
  }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, codeShop, address, machinesSold, spinsUsed, totalSpins } = req.body;

  const employee = await Employee.findById(req.params.id);

  if (employee) {
    employee.name = name ?? employee.name;
    employee.email = email ?? employee.email;
    employee.phone = phone ?? employee.phone;
    employee.codeShop = codeShop ?? employee.codeShop;
    employee.address = address ?? employee.address;
    
    // Lưu giá trị totalSpins hiện tại (nếu có)
    const oldTotalSpins = employee.totalSpins !== undefined 
        ? employee.totalSpins 
        : calculateTotalSpins(employee.machinesSold);
    
    // Check if machinesSold is updated and if it results in a new spin package
    if (machinesSold !== undefined && machinesSold !== employee.machinesSold) {
        const newCalculatedTotalSpins = calculateTotalSpins(machinesSold);

        // If package is upgraded, reset spins and generate a new sequence
        if (newCalculatedTotalSpins > oldTotalSpins) {
            employee.spinsUsed = 0;
            employee.spinTierSequence = generateSpinSequence(newCalculatedTotalSpins);
        }
        employee.machinesSold = machinesSold;
    }

    if (spinsUsed !== undefined) {
        employee.spinsUsed = spinsUsed; // Allow admin to manually reset used spins
    }
    
    // Thêm khả năng ghi đè số lượt quay
    if (totalSpins !== undefined) {
        // Nếu totalSpins thay đổi
        if (totalSpins !== oldTotalSpins) {
            // Lưu totalSpins vào trường totalSpins
            employee.totalSpins = totalSpins;
            
            // Nếu số lượt quay mới lớn hơn số lượt quay cũ
            if (totalSpins > oldTotalSpins) {
                // Reset spinsUsed và tạo lại chuỗi bậc giải thưởng
                employee.spinsUsed = 0;
                employee.spinTierSequence = generateSpinSequence(totalSpins);
            } 
            // Nếu số lượt quay mới nhỏ hơn số lượt quay cũ nhưng lớn hơn số lượt đã sử dụng
            else if (totalSpins > employee.spinsUsed) {
                // Chỉ tạo lại chuỗi bậc giải thưởng, không reset spinsUsed
                employee.spinTierSequence = generateSpinSequence(totalSpins);
            }
            // Nếu số lượt quay mới nhỏ hơn hoặc bằng số lượt đã sử dụng
            else if (totalSpins <= employee.spinsUsed) {
                // Giới hạn spinsUsed không vượt quá totalSpins
                employee.spinsUsed = totalSpins;
                // Xóa chuỗi bậc giải thưởng cũ vì đã hết lượt
                employee.spinTierSequence = [];
            }
        }
    }

    const updatedEmployee = await employee.save();
    res.json(formatEmployeeResponse(updatedEmployee));
  } else {
    res.status(404);
    throw new Error('Không tìm thấy nhân viên');
  }
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findById(req.params.id);

  if (employee) {
    await employee.deleteOne();
    res.json({ message: 'Nhân viên đã được xóa' });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy nhân viên');
  }
});

// @desc    Delete multiple employees
// @route   DELETE /api/employees
// @access  Private/Admin
const deleteManyEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Vui lòng cung cấp một danh sách ID nhân viên để xóa.');
  }

  const result = await Employee.deleteMany({ _id: { $in: ids } });

  if (result.deletedCount === 0) {
    res.status(404);
    throw new Error('Không tìm thấy nhân viên nào với các ID đã cung cấp.');
  }

  res.status(200).json({
    success: true,
    message: `Đã xóa thành công ${result.deletedCount} nhân viên.`,
  });
});

// @desc    Verify employee by code
// @route   GET /api/employees/verify/:employeeCode
// @access  Public
const verifyEmployee = asyncHandler(async (req: Request, res: Response) => {
  const employee = await Employee.findOne({ employeeCode: req.params.employeeCode });

  if (employee) {
    const formattedEmployee = formatEmployeeResponse(employee);
    res.json({
        exists: true,
        employee: {
            name: formattedEmployee.name,
            email: formattedEmployee.email,
            phone: formattedEmployee.phone,
            codeShop: formattedEmployee.codeShop,
            address: formattedEmployee.address,
            remainingSpins: formattedEmployee.remainingSpins,
            machinesSold: formattedEmployee.machinesSold
        }
    });
  } else {
    res.status(404).json({ exists: false, message: 'Mã nhân viên không tồn tại' });
  }
});

// @desc    Import nhân viên từ file Excel
// @route   POST /api/employees/import
// @access  Private/Admin
const importEmployees = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Vui lòng tải lên một file Excel');
    }

    // Đọc file Excel
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<EmployeeImportRow>(worksheet);

    if (!Array.isArray(data) || data.length === 0) {
      res.status(400);
      throw new Error('File Excel không có dữ liệu hợp lệ');
    }

    const results = {
      total: data.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const row of data) {
      const rowIdentifier = `(Mã NV: ${row["Mã nhân viên"] || row["Mã số"] || 'N/A'}, Email: ${row["Email"] || 'N/A'})`;
      try {
        // Chuẩn hóa và làm sạch dữ liệu từ Excel
        const employeeCode = (row["Mã nhân viên"] || row["Mã số"]) ? String(row["Mã nhân viên"] || row["Mã số"]).trim() : undefined;
        const name = (row["Họ tên"] || row["Họ Tên"]) ? String(row["Họ tên"] || row["Họ Tên"]).trim() : undefined;
        const email = row["Email"] ? String(row["Email"]).trim() : undefined;
        const machinesSold = Number(row["Số máy bán được"] || 0);
        const customTotalSpins = row["Số lượt quay"] !== undefined ? Number(row["Số lượt quay"]) : undefined;
        const phone = row["Số điện thoại"] ? String(row["Số điện thoại"]).trim() : '';
        const codeShop = row["Mã cửa hàng"] ? String(row["Mã cửa hàng"]).trim() : '';
        const address = row["Địa chỉ"] ? String(row["Địa chỉ"]).trim() : '';

        if (!employeeCode || !name || !email) {
          results.failed++;
          results.errors.push(`Dòng ${rowIdentifier} thiếu thông tin bắt buộc (Mã nhân viên, Họ tên, Email).`);
          continue;
        }

        // Tìm nhân viên theo mã hoặc email
        let employee = await Employee.findOne({ 
          $or: [{ employeeCode }, { email }] 
        });

        if (employee) {
          // --- LOGIC CẬP NHẬT ---
          // Chỉ cập nhật các trường có giá trị được cung cấp từ file Excel
          // Các trường bắt buộc như name và email sẽ luôn được cập nhật
          employee.name = name;
          employee.email = email;
          employee.machinesSold = machinesSold; // Luôn cập nhật số máy bán

          // Các trường tùy chọn chỉ cập nhật nếu có giá trị
          if (phone) employee.phone = phone;
          if (codeShop) employee.codeShop = codeShop;
          if (address) employee.address = address;
          
          // Lấy giá trị totalSpins hiện tại
          const oldTotalSpins = employee.totalSpins !== undefined 
              ? employee.totalSpins 
              : calculateTotalSpins(employee.machinesSold);
           
          // Xử lý số lượt quay tùy chỉnh nếu có
          if (customTotalSpins !== undefined) {
            // Nếu số lượt quay tùy chỉnh khác với số lượt quay được tính toán hiện tại
            if (customTotalSpins !== oldTotalSpins) {
                employee.totalSpins = customTotalSpins;
                // Reset và tạo lại chuỗi nếu gói quay được nâng cấp
                if (customTotalSpins > oldTotalSpins) {
                    employee.spinsUsed = 0;
                    employee.spinTierSequence = generateSpinSequence(customTotalSpins);
                } else if (customTotalSpins > employee.spinsUsed) {
                    employee.spinTierSequence = generateSpinSequence(customTotalSpins);
                } else {
                    employee.spinsUsed = customTotalSpins;
                    employee.spinTierSequence = [];
                }
            }
          } else {
            // Nếu không có totalSpins tùy chỉnh, tính toán lại dựa trên machinesSold
            const newTotalSpins = calculateTotalSpins(machinesSold);
            if (newTotalSpins > oldTotalSpins) {
              employee.spinsUsed = 0;
              employee.spinTierSequence = generateSpinSequence(newTotalSpins);
              // Xóa totalSpins tùy chỉnh cũ nếu có
              employee.totalSpins = undefined; 
            }
          }
           
          await employee.save();
          results.updated++;
        } else {
          // --- LOGIC TẠO MỚI ---
          // Tạo nhân viên mới
          const totalSpins = calculateTotalSpins(machinesSold);
          const spinTierSequence = generateSpinSequence(totalSpins);
           
          const newEmployee = new Employee({
            employeeCode,
            name,
            email,
            phone,
            codeShop,
            address,
            machinesSold,
            spinsUsed: 0,
            spinTierSequence
          });
           
          await newEmployee.save();
          results.created++;
        }
      } catch (error: any) {
        results.failed++;
        let errorMessage = `Lỗi xử lý dòng ${rowIdentifier}: `;

        if (error.code === 11000) { // Lỗi trùng lặp của MongoDB
            const field = Object.keys(error.keyValue)[0];
            const value = error.keyValue[field];
            if (field === 'employeeCode') {
                errorMessage += `Mã nhân viên "${value}" đã tồn tại.`;
            } else if (field === 'email') {
                errorMessage += `Email "${value}" đã tồn tại.`;
            } else {
                errorMessage += `Giá trị bị trùng lặp cho trường ${field}.`;
            }
        } else if (error.name === 'ValidationError') { // Lỗi xác thực của Mongoose
            const validationErrors = Object.values(error.errors).map((e: any) => e.message).join(', ');
            errorMessage += `Dữ liệu không hợp lệ - ${validationErrors}`;
        } else { // Các lỗi khác
            errorMessage += error.message;
        }
        results.errors.push(errorMessage);
      }
    }

    res.status(200).json({
      success: true,
      message: `Đã xử lý ${results.total} nhân viên: Tạo mới ${results.created}, Cập nhật ${results.updated}, Lỗi ${results.failed}`,
      results
    });
  } catch (error) {
    console.error('Lỗi nghiêm trọng khi import nhân viên:', error);
    const message = error instanceof Error ? error.message : 'Lỗi server không xác định khi import nhân viên.';
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi nghiêm trọng trong quá trình import.',
        error: message
      });
    }
  }
});

export {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  deleteManyEmployees,
  verifyEmployee,
  importEmployees,
}; 