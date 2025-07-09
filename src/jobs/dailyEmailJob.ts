import cron from 'node-cron';
import Employee from '../models/Employee';
import Spin from '../models/Spin';
import { checkAndSendWinningEmailForEmployee } from '../utils/emailService';

// Sao chép hàm từ controller để tránh lỗi import vòng
const calculateTotalSpins = (machinesSold: number): number => {
  if (machinesSold >= 10) return 6;
  if (machinesSold >= 5) return 3;
  if (machinesSold >= 1) return 1;
  return 0;
};

console.log('Cron job module prepared');

const scheduleEndOfDayEmailJob = () => {
  console.log('Scheduling end-of-day email job...');
  // Chạy vào 23:59 mỗi ngày, theo múi giờ Việt Nam
  cron.schedule('59 23 * * *', async () => {
    console.log('Running a job at 23:59: Sending end-of-day summary emails for employees...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      // 1. Tìm tất cả các ID nhân viên có lượt quay trong ngày hôm nay
      const spinsToday = await Spin.find({
        createdAt: { $gte: today, $lt: tomorrow },
        employee: { $exists: true, $ne: null }
      }).distinct('employee');

      if (spinsToday.length === 0) {
        console.log('No employee spins today. Job finished.');
        return;
      }
      
      console.log(`Found ${spinsToday.length} employees who spun today. Checking their status...`);

      // 2. Lặp qua từng nhân viên để kiểm tra
      for (const employeeId of spinsToday) {
        const employee = await Employee.findById(employeeId);

        if (!employee) {
          console.warn(`Employee with ID ${employeeId} not found, skipping.`);
          continue;
        }

        // Ưu tiên sử dụng totalSpins tùy chỉnh nếu có
        const totalSpins = employee.totalSpins !== undefined 
            ? employee.totalSpins 
            : calculateTotalSpins(employee.machinesSold);
        
        // 3. Chỉ gửi mail nếu họ đã quay nhưng CHƯA hết lượt
        if (employee.spinsUsed > 0 && employee.spinsUsed < totalSpins) {
          console.log(`Employee ${employee.employeeCode} has ${employee.spinsUsed}/${totalSpins} spins. Sending summary email.`);
          
          // Gửi email tổng kết
          await checkAndSendWinningEmailForEmployee(employee);

        } else {
          console.log(`Employee ${employee.employeeCode} has finished all spins or has 0 spins used. No email needed from cron.`);
        }
      }

      console.log('End-of-day email job finished successfully.');

    } catch (error) {
      console.error('Error running end-of-day email job for employees:', error);
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });
  console.log('End-of-day email job has been scheduled.');
};

export default scheduleEndOfDayEmailJob; 