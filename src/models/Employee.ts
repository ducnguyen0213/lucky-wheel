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
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);

export default Employee; 