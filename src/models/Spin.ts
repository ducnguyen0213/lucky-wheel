import mongoose, { Document, Schema } from 'mongoose';

// Định nghĩa interface cho document Spin
export interface ISpin extends Document {
  user?: mongoose.Types.ObjectId;
  employee?: mongoose.Types.ObjectId;
  prize: mongoose.Types.ObjectId | null;
  isWin: boolean;
  createdAt: Date;
}

// Schema cho Spin
const SpinSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  prize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize',
    default: null
  },
  isWin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
SpinSchema.index({ user: 1, createdAt: -1 });
SpinSchema.index({ employee: 1, createdAt: -1 });
SpinSchema.index({ createdAt: -1 });

// Tạo và export Spin model
export default mongoose.model<ISpin>('Spin', SpinSchema); 