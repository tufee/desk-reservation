import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, passwordConfirmation } = createUserDto;
    const isUser = await this.userRepository.findOneByEmail(email);

    if (isUser) {
      throw new HttpException('Email already used.', HttpStatus.BAD_REQUEST);
    }

    if (password !== passwordConfirmation) {
      throw new HttpException(
        'Password and password confirmation does not match.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await this.authService.hashPassword(password);

    const userPayload = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const user = await this.userRepository.save(userPayload);

    await this.mailService.sendVerificationLink(user);

    return user;
  }
}
