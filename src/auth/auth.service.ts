import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfirmEmailDto } from './dto/confirm-email.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async hashPassword(password: string): Promise<string> {
    const saltOrRounds = 10;
    return bcrypt.hash(password, saltOrRounds);
  }

  async compareHash(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateVerificationToken(id: object): Promise<string> {
    return this.jwtService.signAsync(id);
  }

  async verifyToken(token: string): Promise<ConfirmEmailDto> {
    return this.jwtService.verify(token);
  }
}
