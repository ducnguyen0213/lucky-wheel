import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa interface cho document Prize
export interface IPrize extends Document {
  name: string;
  description?: string;
  imageUrl?: string;
  probability: number; // tỉ lệ trúng, từ 0-100
  remainingQuantity: number;
  originalQuantity: number;
  active: boolean;
  createdAt: Date;
}

// Schema cho Prize
const PrizeSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên phần thưởng'],
    trim: true,
    maxlength: [100, 'Tên phần thưởng không quá 100 ký tự']
  },
  description: {
    type: String,
    maxlength: [500, 'Mô tả không quá 500 ký tự']
  },
  imageUrl: {
    type: String,
    match: [
      /^(http|https):\/\/[^ "]+$/,
      'URL hình ảnh không hợp lệ'
    ]
  },
  probability: {
    type: Number,
    required: [true, 'Vui lòng nhập tỉ lệ trúng thưởng'],
    min: [0, 'Tỉ lệ trúng thưởng phải từ 0-100'],
    max: [100, 'Tỉ lệ trúng thưởng phải từ 0-100']
  },
  remainingQuantity: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng phần thưởng'],
    min: [0, 'Số lượng phần thưởng không được âm']
  },
  originalQuantity: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng phần thưởng ban đầu'],
    min: [0, 'Số lượng phần thưởng không được âm']
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo và export Prize model
export default mongoose.model<IPrize>('Prize', PrizeSchema); 