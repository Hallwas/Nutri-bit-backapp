import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [MealPlansController],
  providers: [MealPlansService, PrismaService]
})
export class MealPlansModule {}
