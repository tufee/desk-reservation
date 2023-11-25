import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, 'database.sqlite'),
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
