import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FoodsService } from './foods.service';

@Controller('foods')
export class FoodsController {
    constructor(private foodsService: FoodsService) { }

    @Get()
    async search(@Query('search') search?: string) {
        return this.foodsService.search(search);
    }

    @Get(':id/similar')
    async findSimilar(
        @Param('id', ParseIntPipe) id: number,
        @Query('grams') grams?: string,
        @Query('limit') limit?: string,
    ) {
        return this.foodsService.findSimilar(id, grams, limit);
    }
}
