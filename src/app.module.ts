import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, 'database.sqlite'),
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
