import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';

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
      const tokenPayload = await this.authService.verifyToken(token);

      await this.userRepository.update(tokenPayload.id, {
        email_confirmed: true,
      });

      return 'Email confirmed';
    } catch (error) {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto.email, signInDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    try {
      await this.authService.forgotPassword(email);

      return {
        message: 'if the email exists, the reset instructions will be sent',
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
