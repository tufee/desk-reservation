import { MailerService } from '@nestjs-modules/mailer';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { User } from '../user/entities/user.entity';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let authService: AuthService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: AuthService,
          useValue: {
            generateVerificationToken: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    authService = module.get<AuthService>(AuthService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationLink', () => {
    it('should send a verification email', async () => {
      const user = new User();
      user.id = 'UUID';
      user.email = 'john@example.com';
      user.name = 'john';

      const token = 'token';
      jest
        .spyOn(authService, 'generateVerificationToken')
        .mockResolvedValue(token);

      await service.sendVerificationLink(user);

      expect(authService.generateVerificationToken).toHaveBeenCalledWith({
        id: user.id,
      });

      const url = `http://localhost:3000/auth/confirm?token=${token}`;

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: user.email,
        subject: 'Welcome to Desk Reservation App! Confirm your Email',
        template: './confirmation',
        context: {
          name: user.name,
          url,
        },
      });
    });
  });
});
