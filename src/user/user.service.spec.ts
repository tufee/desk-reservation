import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let authService: AuthService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findOneByEmail: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            hashPassword: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationLink: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    authService = module.get<AuthService>(AuthService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'john',
      email: 'john@example.com',
      password: 'password123',
      passwordConfirmation: 'password456',
    };

    it('should throw an exception if email is already used', async () => {
      jest
        .spyOn(userRepository, 'findOneByEmail')
        .mockResolvedValue(new User());

      await expect(service.create(createUserDto)).rejects.toThrow(
        new HttpException('Email already used.', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an exception if password and confirmation do not match', async () => {
      jest.spyOn(userRepository, 'findOneByEmail').mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new HttpException(
          'Password and password confirmation does not match.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should create a new user when valid data is provided', async () => {
      const createUserDto = {
        name: 'john',
        email: 'john@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      };

      const user: User = {
        name: 'john',
        email: 'john@example.com',
        password: 'hashedPassword',
      } as User;

      const newUser: User = {
        name: 'john',
        email: 'john@example.com',
        password: 'hashedPassword',
        id: '17dbc3e3-02d9-45ae-99ce-475329fcc8ee',
        created_at: new Date('2024-01-11T01:34:53.509Z'),
        updated_at: new Date('2024-01-11T01:34:53.509Z'),
        email_confirmed: false,
      };

      jest.spyOn(userRepository, 'findOneByEmail').mockResolvedValue(null);

      jest
        .spyOn(authService, 'hashPassword')
        .mockResolvedValue('hashedPassword');

      jest.spyOn(userRepository, 'create').mockReturnValue(user);

      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);

      await service.create(createUserDto);

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );

      expect(authService.hashPassword).toHaveBeenCalledWith(
        createUserDto.password,
      );

      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });

      expect(userRepository.save).toHaveBeenCalledWith(user);

      expect(mailService.sendVerificationLink).toHaveBeenCalledWith(newUser);
    });
  });
});
