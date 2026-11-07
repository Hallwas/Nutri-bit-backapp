import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from 'src/auth/roles.guard';
import { PrismaService } from 'src/database/prisma.service';
import { CreateUserDTO } from 'src/dtos/create-users-dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
@Roles('admin')
export class UsersController {
    constructor(
       private service: UsersService
    ) { }

    @Post()
    async create(@Body() body: CreateUserDTO) {
        //chamar o service aqui
        await this.service.createUser(body);
    }

    @Get()
    async findAll() {
        return await this.service.getAllUsers();
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, 
                 @Body() body: CreateUserDTO) 
    {
        await this.service.updateUser(id, body);
    }
    
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        await this.service.deleteUser(id);
    }


}