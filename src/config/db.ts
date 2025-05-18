import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ducnguyen1302cat:AUyX0EyxqGnEDgfn@lucky.isw0a6d.mongodb.net/lucky-wheel?retryWrites=true&w=majority&appName=lucky';
    
    await mongoose.connect(mongoUri);
    
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB; 