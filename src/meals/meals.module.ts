import { Module } from '@nestjs/common';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [MealsController],
  providers: [MealsService, PrismaService]
})
export class MealsModule {}
