import {
    Controller,
    Post,
    Req,
    UseGuards,
    Get,
    Delete,
    Put,
    Param,
    Body,
    ParseIntPipe,
} from '@nestjs/common';

import { CreateProfileDto } from 'src/dtos/create-profile-dto';
import { UpdateProfileDto } from 'src/dtos/update-profile-dto';
import { Roles, RolesGuard } from 'src/auth/roles.guard';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
    constructor(private profilesService: ProfilesService) { }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Post()
    async create(@Body() dto: CreateProfileDto) {
        return await this.profilesService.create(dto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Get()
    async findAll() {
        return this.profilesService.findAll();
    }

    @Get('me')
    async findMe(@Req() req: any) {
        return this.profilesService.findMe(req.user.sub);
    }

    @Put('me')
    async upsertMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
        return this.profilesService.upsertMe(req.user.sub, dto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.profilesService.findOne(id);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.profilesService.update(id, dto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.profilesService.remove(id);
    }
}