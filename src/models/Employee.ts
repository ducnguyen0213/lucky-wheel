import mongoose, { Document, Schema } from 'mongoose';
import validator from 'validator';

export interface IEmployee extends Document {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  codeShop: string;
  address: string;
  machinesSold: number; // 2 or 5
  spinsUsed: number;
  spinTierSequence: number[];
  totalSpins?: number; // Thêm trường totalSpins tùy chỉnh
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Email không hợp lệ'],
    },
    phone: {
      type: String,
      trim: true,
    },
    codeShop: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    machinesSold: {
      type: Number,
      required: true,
      min: [0, 'Số máy bán không được âm'],
      default: 0,
    },
    spinsUsed: {
      type: Number,
      required: true,
      default: 0,
    },
    spinTierSequence: {
        type: [Number],
        default: []
    },
    totalSpins: {
        type: Number,
        min: [0, 'Số lượt quay không được âm']
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Thêm text index để hỗ trợ tìm kiếm toàn văn không phân biệt dấu
employeeSchema.index(
  {
    name: 'text',
    employeeCode: 'text',
    email: 'text',
    phone: 'text',
  },
  {
    name: 'employee_text_search_index',
    default_language: 'none', // Tắt tính năng language-specific để hoạt động tốt với tiếng Việt
    weights: {
      name: 10,
      employeeCode: 5,
      email: 2,
      phone: 2,
    },
  }
);


const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);

export default Employee; 