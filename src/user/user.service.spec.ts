import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'test',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      };

      const user = new User();
      user.id = 'UUID';
      user.name = 'test';
      user.email = 'test@example.com';
      user.password = 'hashedPassword';

      jest
        .spyOn(service['userRepository'], 'findOneBy')
        .mockResolvedValue(null);

      jest
        .spyOn(authService, 'hashPassword')
        .mockResolvedValue('hashedPassword');

      jest.spyOn(service['userRepository'], 'create').mockReturnValue(user);
      jest.spyOn(service['userRepository'], 'save').mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();

      expect(service['userRepository'].findOneBy).toHaveBeenCalledWith({
        email: 'test@example.com',
      });

      expect(authService.hashPassword).toHaveBeenCalledWith('password123');

      expect(service['userRepository'].create).toHaveBeenCalledWith({
        name: 'test',
        email: 'test@example.com',
        password: 'hashedPassword',
        passwordConfirmation: 'password123',
      });

      expect(service['userRepository'].save).toHaveBeenCalled();
    });

    it('should throw an exception for duplicate email', async () => {
      const createUserDto = {
        name: 'test',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      };
      const user = new User();
      user.id = 'UUID';
      user.name = 'test';
      user.email = 'test@example.com';
      user.password = 'hashed';

      jest
        .spyOn(service['userRepository'], 'findOneBy')
        .mockResolvedValue(user);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new HttpException('Email already used.', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an exception for password mismatch', async () => {
      const createUserDto = {
        name: 'test',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirmation: 'differentPassword',
      };

      jest
        .spyOn(service['userRepository'], 'findOneBy')
        .mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrowError(
        new HttpException(
          'Password and password confirmation does not match.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
