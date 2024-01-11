import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
  ) {}

  @Get('confirm')
  async confirmEmail(@Query('token') token: string) {
    try {
      // TODO add redirect to login page
      const tokenPayload = await this.authService.verifyToken(token);

      await this.userRepository.update(tokenPayload.id, {
        email_confirmed: true,
      });

      return 'Email confirmed';
    } catch (error) {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }
  }
}
