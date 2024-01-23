import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  async sendVerificationLink(user: User) {
    const token = await this.authService.generateToken(user.id, user.name);

    const url = `http://localhost:3000/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Desk Reservation App! Confirm your Email',
      template: './confirmation',
      context: {
        name: user.name,
        url,
      },
    });
  }

  async sendForgotPasswordLink(user: User) {
    const token = await this.authService.generateToken(user.id, user.name);

    const url = `http://localhost:3000/auth/reset-password/${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Desk Reservation | Reset Password',
      template: './reset-password',
      context: {
        name: user.name,
        url,
      },
    });
  }
}
