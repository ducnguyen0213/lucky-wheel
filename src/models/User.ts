import mongoose, { Document, Schema } from 'mongoose';
import validator from 'validator';

// Định nghĩa interface cho document User
export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  codeShop: string;
  address: string;
  spinsToday: number;
  lastSpinDate: Date;
  createdAt: Date;
}

// Schema cho User
const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [100, 'Họ tên không quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    validate: {
      validator: function(v: string) {
        // Simple regex for Vietnamese phone number
        return /^(0|\+84)(\d{9,10})$/.test(v);
      },
      message: 'Số điện thoại không hợp lệ'
    }
  },
  codeShop: {
    type: String,
    required: [true, 'Vui lòng nhập mã cửa hàng'],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Địa chỉ không quá 500 ký tự']
  },
  spinsToday: {
    type: Number,
    default: 0
  },
  lastSpinDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo và export User model
export default mongoose.model<IUser>('User', UserSchema); 