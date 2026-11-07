import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService, PrismaService]
})
export class FoodsModule {}
