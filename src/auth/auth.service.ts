import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../user/user.repository';
import { ConfirmEmailDto } from './dto/confirm-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    return bcrypt.hash(password, saltOrRounds);
  }

  async compareHash(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateToken(id: string, username: string): Promise<string> {
    return this.jwtService.signAsync({ id, username });
  }

  async verifyToken(token: string): Promise<ConfirmEmailDto> {
    return this.jwtService.verifyAsync(token);
  }

  async signIn(email: string, password: string) {
    const user = await this.userRepository.findOneByEmail(email);

    const isCorrectPassword = await this.compareHash(password, user.password);

    if (!isCorrectPassword) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.name };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
