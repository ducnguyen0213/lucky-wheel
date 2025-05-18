import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Định nghĩa interface cho document Admin
export interface IAdmin extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

// Schema cho Admin
const AdminSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Email không hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên'],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Mã hóa mật khẩu trước khi lưu
AdminSchema.pre<IAdmin>('save', async function(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Kiểm tra mật khẩu
AdminSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Tạo JWT token
AdminSchema.methods.getSignedJwtToken = function(): string {
  // @ts-ignore - Ignore typings issue with jwt.sign
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Tạo và export Admin model
export default mongoose.model<IAdmin>('Admin', AdminSchema); 
 