import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../user/user.repository';
import { AuthService } from './auth.service';
import { ConfirmEmailDto } from './dto/confirm-email.dto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash the password', async () => {
      const password = 'password123';
      const hashedPassword = await service.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(password);
    });
  });

  describe('compareHash', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'password123';
      const hashedPassword = await service.hashPassword(password);

      const result = await service.compareHash(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'password123';
      const hashedPassword = await service.hashPassword(password);

      const result = await service.compareHash('wrongPassword', hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a token', async () => {
      const id = '123';
      const name = 'john';
      const expectedToken = 'token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(expectedToken);

      const result = await service.generateToken(id, name);

      expect(jwtService.signAsync).toHaveBeenCalledWith({ id, name });
      expect(result).toBe(expectedToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify a token', async () => {
      const token = 'token';
      const expectedPayload: ConfirmEmailDto = {
        id: '123',
        iat: 123456789,
        exp: 123456789,
      };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(expectedPayload);

      const result = await service.verifyToken(token);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
      expect(result).toBe(expectedPayload);
    });
  });
});
