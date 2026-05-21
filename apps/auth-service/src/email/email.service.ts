import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(
    to: string,
    otp: string,
    purpose: 'signup' | 'reset_password' | 'login' | 'verify_email',
  ) {
    console.log('request is on email');
    try {
      await this.mailerService.sendMail({
        to,
        subject: `Your verification code: ${otp}`,
        html: `
           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your one-time password for <strong>${purpose}</strong> is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; 
                    font-size: 32px; font-weight: bold; letter-spacing: 8px; 
                    border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #999; font-size: 12px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
        `,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      console.log(error);
      // Don't throw — the OTP is already saved in DB.
      // The user can request a resend.
      // But DO log it so you know about delivery failures.
    }
  }
}
