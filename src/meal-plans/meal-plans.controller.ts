import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { CreateMealPlanDto } from 'src/dtos/create-meal-plan-dto';
import { UpdateMealPlanDto } from 'src/dtos/update-meal-plan-dto';
import { MealPlansService } from './meal-plans.service';

@Controller('meal-plans')
export class MealPlansController {
    constructor(private mealPlansService: MealPlansService) { }

    @Get('templates')
    async findTemplates(@Req() req: any) {
        return this.mealPlansService.findTemplates(req.user.sub);
    }

    @Post('templates/:id/use')
    async useTemplate(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.mealPlansService.useTemplate(req.user.sub, id);
    }

    @Get()
    async findAll(@Req() req: any) {
        return this.mealPlansService.findAll(req.user.sub);
    }

    @Post()
    async create(@Req() req: any, @Body() dto: CreateMealPlanDto) {
        return this.mealPlansService.create(req.user.sub, dto);
    }

    @Get(':id')
    async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.mealPlansService.findOne(req.user.sub, id);
    }

    @Put(':id')
    async update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMealPlanDto) {
        return this.mealPlansService.update(req.user.sub, id, dto);
    }

    @Delete(':id')
    async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        await this.mealPlansService.remove(req.user.sub, id);
    }

    @Delete(':id/weeks/:weekId')
    async removeWeek(
        @Req() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Param('weekId', ParseIntPipe) weekId: number,
    ) {
        return this.mealPlansService.removeWeek(req.user.sub, id, weekId);
    }

    @Post(':id/weeks')
    async addWeek(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.mealPlansService.addWeek(req.user.sub, id);
    }
}
