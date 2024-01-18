import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User> | null {
    return this.userRepository.findOneBy({ email });
  }

  create(user: CreateUserDto): User {
    return this.userRepository.create(user);
  }

  save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
