import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private authService: AuthService,
  ) {}

  async sendVerificationLink(user: User) {
    const token = await this.authService.generateVerificationToken({
      id: user.id,
    });

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
}
