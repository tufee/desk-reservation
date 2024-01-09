import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, passwordConfirmation } = createUserDto;
    const isUser = await this.userRepository.findOneBy({
      email,
    });

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
    createUserDto.password = hashedPassword;

    const userPayload = this.userRepository.create(createUserDto);

    const user = await this.userRepository.save(userPayload);

    await this.mailService.sendVerificationLink(user);

    return user;
  }
}
