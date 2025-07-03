import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa interface cho document Prize
export interface IPrize extends Document {
  name: string;
  description?: string;
  imageUrl?: string;
  probability: number; // tỉ lệ trúng, từ 0-100
  tier: number; // Bậc giải thưởng (ví dụ: 1, 2, 3)
  remainingQuantity: number;
  originalQuantity: number;
  active: boolean;
  isRealPrize: boolean; // Xác định có phải là phần thưởng thật hay không (như "chúc bạn may mắn lần sau")
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
  tier: {
    type: Number,
    required: [true, 'Vui lòng nhập Bậc của giải thưởng'],
    index: true // Thêm index để tối ưu truy vấn theo Bậc
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
  isRealPrize: {
    type: Boolean,
    default: true, // Mặc định là phần thưởng thật
    required: [true, 'Vui lòng xác định đây có phải phần thưởng thật hay không']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo và export Prize model
export default mongoose.model<IPrize>('Prize', PrizeSchema); 