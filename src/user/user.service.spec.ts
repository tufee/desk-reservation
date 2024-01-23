import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let userServiceMock: UserService;
  let userRepositoryMock: UserRepository;
  let authServiceMock: AuthService;
  let mailServiceMock: MailService;

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

    userServiceMock = module.get<UserService>(UserService);
    userRepositoryMock = module.get<UserRepository>(UserRepository);
    authServiceMock = module.get<AuthService>(AuthService);
    mailServiceMock = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(userServiceMock).toBeDefined();
  });

  describe('create', () => {
    const createUserDtoMock: CreateUserDto = {
      name: 'john',
      email: 'john@example.com',
      password: 'password123',
      passwordConfirmation: 'password456',
    };

    it('should throw an exception if email is already used', async () => {
      jest
        .spyOn(userRepositoryMock, 'findOneByEmail')
        .mockResolvedValue(new User());

      await expect(userServiceMock.create(createUserDtoMock)).rejects.toThrow(
        new HttpException('Email already used.', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an exception if password and confirmation do not match', async () => {
      jest.spyOn(userRepositoryMock, 'findOneByEmail').mockResolvedValue(null);

      await expect(userServiceMock.create(createUserDtoMock)).rejects.toThrow(
        new HttpException(
          'Password and password confirmation does not match.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should create a new user when valid data is provided', async () => {
      const createUserDtoMock = {
        name: 'john',
        email: 'john@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      };

      const userMock: User = {
        name: 'john',
        email: 'john@example.com',
        password: 'hashedPassword',
      } as User;

      const newUserMock: User = {
        name: 'john',
        email: 'john@example.com',
        password: 'hashedPassword',
        id: '17dbc3e3-02d9-45ae-99ce-475329fcc8ee',
        created_at: new Date('2024-01-11T01:34:53.509Z'),
        updated_at: new Date('2024-01-11T01:34:53.509Z'),
        email_confirmed: false,
      };

      jest.spyOn(userRepositoryMock, 'findOneByEmail').mockResolvedValue(null);

      jest
        .spyOn(authServiceMock, 'hashPassword')
        .mockResolvedValue('hashedPassword');

      jest.spyOn(userRepositoryMock, 'create').mockReturnValue(userMock);

      jest.spyOn(userRepositoryMock, 'save').mockResolvedValue(newUserMock);

      await userServiceMock.create(createUserDtoMock);

      expect(userRepositoryMock.findOneByEmail).toHaveBeenCalledWith(
        createUserDtoMock.email,
      );

      expect(authServiceMock.hashPassword).toHaveBeenCalledWith(
        createUserDtoMock.password,
      );

      expect(userRepositoryMock.create).toHaveBeenCalledWith({
        ...createUserDtoMock,
        password: 'hashedPassword',
      });

      expect(userRepositoryMock.save).toHaveBeenCalledWith(userMock);

      expect(mailServiceMock.sendVerificationLink).toHaveBeenCalledWith(
        newUserMock,
      );
    });
  });
});
