import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { AuthService } from './auth.service';
import { TokenPayloadDto } from './dto/token-payload.dto';

describe('AuthService', () => {
  let authServiceMock: AuthService;
  let jwtServiceMock: JwtService;
  let userRepositoryMock: UserRepository;
  let mailServiceMock: MailService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        UserRepository,
        {
          provide: UserRepository,
          useValue: {
            findOneByEmail: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationLink: jest.fn(),
            sendForgotPasswordLink: jest.fn(),
          },
        },
      ],
    }).compile();

    authServiceMock = module.get<AuthService>(AuthService);
    jwtServiceMock = module.get<JwtService>(JwtService);
    userRepositoryMock = module.get<UserRepository>(UserRepository);
    mailServiceMock = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(authServiceMock).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash the password', async () => {
      const password = 'password123';
      const hashedPassword = await authServiceMock.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(password);
    });
  });

  describe('compareHash', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'password123';
      const hashedPassword = await authServiceMock.hashPassword(password);

      const result = await authServiceMock.compareHash(
        password,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'password123';
      const hashedPassword = await authServiceMock.hashPassword(password);

      const result = await authServiceMock.compareHash(
        'wrongPassword',
        hashedPassword,
      );
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a token', async () => {
      const id = '123';
      const name = 'john';
      const expectedToken = 'token';
      jest.spyOn(jwtServiceMock, 'signAsync').mockResolvedValue(expectedToken);

      const result = await authServiceMock.generateToken(id, name);

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({ id, name });
      expect(result).toBe(expectedToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify a token', async () => {
      const token = 'token';
      const expectedPayload: TokenPayloadDto = {
        id: '123',
        name: 'john',
        iat: 123456789,
        exp: 123456789,
      };

      jest
        .spyOn(jwtServiceMock, 'verifyAsync')
        .mockResolvedValue(expectedPayload);

      const result = await authServiceMock.verifyToken(token);

      expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(token);
      expect(result).toBe(expectedPayload);
    });
  });

  describe('signIn', () => {
    it('should return an access token', async () => {
      const user: User = {
        id: 'UUID',
        name: 'john',
        email: 'email',
        email_confirmed: true,
        password: 'hashedPassword',
      } as User;

      const password = 'password';
      const expectedToken = 'token';

      jest.spyOn(userRepositoryMock, 'findOneByEmail').mockResolvedValue(user);
      jest.spyOn(authServiceMock, 'compareHash').mockResolvedValue(true);
      jest
        .spyOn(authServiceMock, 'generateToken')
        .mockResolvedValue(expectedToken);

      const result = await authServiceMock.signIn(user.email, password);

      expect(userRepositoryMock.findOneByEmail).toHaveBeenCalledWith(
        user.email,
      );
      expect(authServiceMock.compareHash).toHaveBeenCalledWith(
        password,
        user.password,
      );
      expect(authServiceMock.generateToken).toHaveBeenCalledWith(
        user.id,
        user.name,
      );

      expect(result).toEqual({ access_token: expectedToken });
    });

    it('should throw an error if user is not found', async () => {
      const user: User = {
        email: 'email',
      } as User;

      const password = 'password';

      jest.spyOn(userRepositoryMock, 'findOneByEmail').mockResolvedValue(null);

      await expect(
        authServiceMock.signIn(user.email, password),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should throw an error if the password has not been confirmed', async () => {
      const user: User = {
        email: 'email',
        email_confirmed: false,
      } as User;

      const password = 'password';

      jest.spyOn(userRepositoryMock, 'findOneByEmail').mockResolvedValue(user);

      await expect(
        authServiceMock.signIn(user.email, password),
      ).rejects.toThrow(new UnauthorizedException('Please confirm your email'));
    });

    it('should throw an error if password is incorrect', async () => {
      const user: User = {
        email: 'email',
        email_confirmed: true,
        password: 'hashedPassword',
      } as User;

      const password = 'password';

      jest.spyOn(userRepositoryMock, 'findOneByEmail').mockResolvedValue(user);
      jest.spyOn(authServiceMock, 'compareHash').mockResolvedValue(false);

      await expect(
        authServiceMock.signIn(user.email, password),
      ).rejects.toThrow(new UnauthorizedException());

      expect(userRepositoryMock.findOneByEmail).toHaveBeenCalledWith(
        user.email,
      );
      expect(authServiceMock.compareHash).toHaveBeenCalledWith(
        password,
        user.password,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send a password reset link when a user is found', async () => {
      const userMock = { email: 'john@example.com' } as User;
      jest
        .spyOn(userRepositoryMock, 'findOneByEmail')
        .mockResolvedValue(userMock);

      await expect(
        authServiceMock.forgotPassword(userMock.email),
      ).resolves.toBeUndefined();

      expect(mailServiceMock.sendForgotPasswordLink).toHaveBeenCalledWith(
        userMock,
      );
    });

    it('should not send a password reset link when a user is not found', async () => {
      jest.spyOn(userRepositoryMock, 'findOneByEmail').mockResolvedValue(null);

      await expect(
        authServiceMock.forgotPassword('notfound@example.com'),
      ).resolves.toBeUndefined();
      expect(mailServiceMock.sendForgotPasswordLink).not.toHaveBeenCalled();
    });
  });
});
