import { Body, Controller, Delete, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { CreateMealDto } from 'src/dtos/create-meal-dto';
import { UpdateMealDto } from 'src/dtos/update-meal-dto';
import { MealsService } from './meals.service';

@Controller()
export class MealsController {
    constructor(private mealsService: MealsService) { }

    @Post('days/:dayId/meals')
    async create(@Req() req: any, @Param('dayId', ParseIntPipe) dayId: number, @Body() dto: CreateMealDto) {
        return this.mealsService.create(req.user.sub, dayId, dto);
    }

    @Put('meals/:id')
    async update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMealDto) {
        return this.mealsService.update(req.user.sub, id, dto);
    }

    @Delete('meals/:id')
    async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        await this.mealsService.remove(req.user.sub, id);
    }
}
