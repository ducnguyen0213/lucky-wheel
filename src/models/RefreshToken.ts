import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
  user: mongoose.Types.ObjectId;
  expires: Date;
  createdAt: Date;
  createdByIp: string;
  revoked: boolean;
  revokedAt?: Date;
  replacedByToken?: string;
  isExpired: boolean;
  isActive: boolean;
}

const RefreshTokenSchema: Schema = new Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  expires: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdByIp: String,
  revoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  replacedByToken: String
});

// Thêm virtual properties để kiểm tra trạng thái token
RefreshTokenSchema.virtual('isExpired').get(function(this: any) {
  return Date.now() >= this.expires.getTime();
});

RefreshTokenSchema.virtual('isActive').get(function(this: any) {
  return !this.revoked && !this.isExpired;
});

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema); 