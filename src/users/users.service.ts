import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateUserDTO } from 'src/dtos/create-users-dto';
import bcrypt from 'bcryptjs';
import { GetUserDTO } from 'src/dtos/get-user-dto';

@Injectable()
export class UsersService {

    constructor(
        private prisma: PrismaService
    ) { }

    // Cria um usuário novo, guardando a senha como hash (bcrypt).
    async createUser(dto: CreateUserDTO) {
        const passwordHash = await bcrypt.hash(dto.passwordHash, 10);
        return await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash: passwordHash
            }
        })
    }

    // Lista todos os usuários (sem a senha), em ordem alfabética.
    async getAllUsers(): Promise<GetUserDTO[]> {
        return this.prisma.user.findMany({
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { name: 'asc' },
        });
    }

    // Atualiza o nome e o e-mail de um usuário.
    async updateUser(id: number, dto: CreateUserDTO): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: {
                name: dto.name ?? '',
                email: dto.email ?? ''
            }
        });
    }
    // Apaga o usuário pelo id.
    async deleteUser(id: number): Promise<void> {
        await this.prisma.user.delete({
            where: { id }
        });
    }

    // Busca um usuário pelo e-mail (usado no login).
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }
}
