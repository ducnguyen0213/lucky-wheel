import { Request, Response } from 'express';
import Employee from '../models/Employee';
import asyncHandler from 'express-async-handler';

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
    return [];
};

const calculateTotalSpins = (machinesSold: number): number => {
  if (machinesSold >= 10) return 6;
  if (machinesSold >= 5) return 3;
  if (machinesSold >= 1) return 1;
  return 0;
};

const formatEmployeeResponse = (employee: any) => {
    const totalSpins = calculateTotalSpins(employee.machinesSold);
    const remainingSpins = totalSpins - employee.spinsUsed;
    const finalRemainingSpins = Math.max(0, remainingSpins);
    const employeeObj = employee.toObject ? employee.toObject() : employee;

    return {
        ...employeeObj,
        totalSpins,
        remainingSpins: finalRemainingSpins
    };
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
  const employees = await Employee.find({});
  res.json(employees.map(formatEmployeeResponse));
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
  const { name, email, phone, codeShop, address, machinesSold, spinsUsed } = req.body;

  const employee = await Employee.findById(req.params.id);

  if (employee) {
    employee.name = name ?? employee.name;
    employee.email = email ?? employee.email;
    employee.phone = phone ?? employee.phone;
    employee.codeShop = codeShop ?? employee.codeShop;
    employee.address = address ?? employee.address;
    
    // Check if machinesSold is updated and if it results in a new spin package
    if (machinesSold !== undefined && machinesSold !== employee.machinesSold) {
        const oldTotalSpins = calculateTotalSpins(employee.machinesSold);
        const newTotalSpins = calculateTotalSpins(machinesSold);

        // If package is upgraded, reset spins and generate a new sequence
        if (newTotalSpins > oldTotalSpins) {
            employee.spinsUsed = 0;
            employee.spinTierSequence = generateSpinSequence(newTotalSpins);
        }
        employee.machinesSold = machinesSold;
    }

    if (spinsUsed !== undefined) {
        employee.spinsUsed = spinsUsed; // Allow admin to manually reset used spins
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

export {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  verifyEmployee,
}; 