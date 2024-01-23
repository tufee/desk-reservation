import {
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { TokenPayloadDto } from './dto/token-payload.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userRepository: UserRepository,
    @Inject(forwardRef(() => MailService))
    private mailService: MailService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    return bcrypt.hash(password, saltOrRounds);
  }

  async compareHash(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateToken(id: string, name: string): Promise<string> {
    return this.jwtService.signAsync({ id, name });
  }

  async verifyToken(token: string): Promise<TokenPayloadDto> {
    return this.jwtService.verifyAsync(token);
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.userRepository.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.email_confirmed) {
      await this.mailService.sendVerificationLink(user);
      throw new UnauthorizedException('Please confirm your email');
    }

    const isCorrectPassword = await this.compareHash(password, user.password);

    if (!isCorrectPassword) {
      throw new UnauthorizedException();
    }

    return {
      access_token: await this.generateToken(user.id, user.name),
    };
  }

  async forgotPassword(email: string): Promise<User | void> {
    const user = await this.userRepository.findOneByEmail(email);

    if (user) {
      await this.mailService.sendForgotPasswordLink(user);
    }
  }
}
