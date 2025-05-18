import nodemailer from 'nodemailer';
import { IUser } from '../models/User';
import Spin from '../models/Spin';
import { IPrize } from '../models/Prize';

// Cấu hình transporter nodemailer với ZohoMail
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 587,
  secure: false,
  auth: {
    user: 'no-reply.luckywheel@zohomail.com',
    pass: 'BQicVDvrdeBB'
  }
});

// Tên chương trình và thông tin công ty
const PROGRAM_NAME = 'Vòng Quay May Mắn';
const COMPANY_NAME = 'Lucky Wheel';
const COMPANY_PHONE = '1900 1234';
const COMPANY_EMAIL = 'support@luckywheel.com';
const COMPANY_WEBSITE = 'luckywheel.com';

// Interface cho thông tin giải thưởng
interface IPrizeInfo {
  name: string;
  description?: string;
}

/**
 * Gửi email thông báo trúng thưởng cho người dùng
 * @param user Thông tin người dùng
 * @param prizes Danh sách giải thưởng mà người dùng đã trúng
 * @returns Promise<boolean> Kết quả gửi email
 */
export const sendWinningEmail = async (
  user: IUser,
  prizes: IPrizeInfo[]
): Promise<boolean> => {
  try {
    if (!user.email) {
      console.error('Không thể gửi email: Người dùng không có địa chỉ email');
      return false;
    }

    // Tạo danh sách giải thưởng
    let prizeList = '';
    prizes.forEach((prize) => {
      prizeList += `- ${prize.name}${prize.description ? `: ${prize.description}` : ''}\n`;
    });

    // Nội dung email
    const mailOptions = {
      from: `"${PROGRAM_NAME}" <no-reply.luckywheel@zohomail.com>`,
      to: user.email,
      subject: `[${PROGRAM_NAME}] - Xin chúc mừng! Bạn đã trúng thưởng`,
      text: `
Kính gửi ${user.name},

Chúng tôi xin chúc mừng bạn đã trúng thưởng trong chương trình *${PROGRAM_NAME}* do ${COMPANY_NAME} tổ chức.

*Thông tin giải thưởng của bạn:*
Họ tên: ${user.name}
Số điện thoại: ${user.phone}
Email: ${user.email}
${user.address ? `Địa chỉ: ${user.address}` : ''}

Giải thưởng:
${prizeList}

Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để hướng dẫn nhận thưởng.
Hoặc bạn có thể chủ động liên hệ với chúng tôi qua:
Hotline: ${COMPANY_PHONE}
Email: ${COMPANY_EMAIL}

Một lần nữa, xin cảm ơn bạn đã tham gia chương trình của chúng tôi.

Trân trọng,
*${COMPANY_NAME}*
${COMPANY_WEBSITE}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chúc mừng trúng thưởng</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #ff7e5f, #feb47b); text-align: center; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${PROGRAM_NAME}</h1>
      <p style="color: white; margin: 5px 0 0 0;">Thông báo trúng thưởng</p>
    </div>
    
    <!-- Content -->
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <p style="margin-top: 0;">Kính gửi <strong style="color: #ff7e5f;">${user.name}</strong>,</p>
      
      <p>Chúng tôi xin <span style="color: #ff7e5f; font-weight: bold;">chúc mừng</span> bạn đã trúng thưởng trong chương trình <em>${PROGRAM_NAME}</em> do <strong>${COMPANY_NAME}</strong> tổ chức.</p>
      
      <!-- Thông tin người dùng -->
      <div style="background-color: #f9f9f9; border-left: 4px solid #ff7e5f; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #ff7e5f; font-size: 18px;">Thông tin của bạn:</h3>
        <p style="margin: 5px 0;">Họ tên: <strong>${user.name}</strong></p>
        <p style="margin: 5px 0;">Số điện thoại: <strong>${user.phone}</strong></p>
        <p style="margin: 5px 0;">Email: <strong>${user.email}</strong></p>
        ${user.address ? `<p style="margin: 5px 0;">Địa chỉ: <strong>${user.address}</strong></p>` : ''}
      </div>
      
      <!-- Thông tin giải thưởng -->
      <h3 style="color: #ff7e5f; font-size: 18px;">Giải thưởng của bạn:</h3>
      <ul style="background-color: #fff4e6; padding: 15px 15px 15px 35px; border-radius: 5px;">
        ${prizes.map(prize => `<li style="margin-bottom: 8px;"><strong>${prize.name}</strong>${prize.description ? `<span style="color: #666;">: ${prize.description}</span>` : ''}</li>`).join('')}
      </ul>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #e8f4ff; border-radius: 5px;">
        <p style="margin-top: 0;">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để hướng dẫn nhận thưởng.</p>
        <p style="margin-bottom: 0;">Hoặc bạn có thể chủ động liên hệ với chúng tôi qua:</p>
        <p style="margin: 5px 0;">
          <span style="display: inline-block; min-width: 80px; font-weight: bold;">Hotline:</span> 
          <span style="color: #ff7e5f; font-weight: bold;">${COMPANY_PHONE}</span>
        </p>
        <p style="margin: 5px 0;">
          <span style="display: inline-block; min-width: 80px; font-weight: bold;">Email:</span> 
          <a href="mailto:${COMPANY_EMAIL}" style="color: #ff7e5f; text-decoration: none;">${COMPANY_EMAIL}</a>
        </p>
      </div>
      
      <p>Một lần nữa, xin cảm ơn bạn đã tham gia chương trình của chúng tôi.</p>
      
      <p style="margin-bottom: 0;">Trân trọng,</p>
      <p style="margin-top: 5px; font-weight: bold; color: #ff7e5f;">${COMPANY_NAME}</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; color: #999999; font-size: 12px;">
      <p>
        <a href="https://${COMPANY_WEBSITE}" style="color: #ff7e5f; text-decoration: none;">${COMPANY_WEBSITE}</a>
      </p>
      <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `
    };

    // Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email đã được gửi thành công:', info.messageId);
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    return false;
  }
};

// Hàm kiểm tra và gửi email thông báo trúng thưởng
export const checkAndSendWinningEmail = async (user: IUser): Promise<void> => {
  try {
    // Kiểm tra xem người dùng đã quay đủ 5 lần chưa hoặc hết ngày
    if (user.spinsToday >= 5) {
      // Lấy danh sách giải thưởng mà người dùng đã trúng trong ngày
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Lấy các lần quay trúng thưởng và populate thông tin giải thưởng
      const spins = await Spin.find({
        user: user._id,
        isWin: true,
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      }).populate<{ prize: IPrize | null }>('prize');

      // Nếu có giải thưởng, gửi email
      if (spins.length > 0) {
        const prizes = spins
          .filter(spin => spin.prize !== null)
          .map(spin => ({
            name: spin.prize?.name || 'Giải thưởng',
            description: spin.prize?.description
          }));

        if (prizes.length > 0) {
          await sendWinningEmail(user, prizes);
        }
      }
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra và gửi email:', error);
  }
}; 