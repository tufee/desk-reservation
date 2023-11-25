import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
});
