import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateProfileDto } from 'src/dtos/create-profile-dto';
import { UpdateProfileDto } from 'src/dtos/update-profile-dto';
import { calcDaily } from './daily-calories';

@Injectable()
export class ProfilesService {

    constructor(
        private prisma: PrismaService
    ) { }

    // Cria o perfil de um usuário (400 se o usuário não existe, 409 se já tem perfil). Usado pelo admin.
    async create(dto: CreateProfileDto) {
        const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
        if (!user) {
            throw new BadRequestException('Usuário não existe.');
        }
        const existing = await this.prisma.profile.findUnique({
            where: {
                userId: dto.userId
            }
        });
        if (existing) {
            throw new ConflictException('Usuário já possui um perfil.');
        }
        return this.prisma.profile.create({
            data: {
                userId: dto.userId,
                fullName: dto.fullName,
                birthDate: dto.birthDate ? new Date(dto.birthDate) : dto.birthDate,
                avatarUrl: dto.avatarUrl || null,
                weight: dto.weight,
                height: dto.height,
                sex: dto.sex,
                activityLevel: dto.activityLevel,
                goal: dto.goal,
            },
        });
    }

    // Lista todos os perfis com os dados básicos do usuário (admin).
    async findAll() {
        return this.prisma.profile.findMany({
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { fullName: 'asc' },
        });
    }

    // Atualiza um perfil pelo id (404 se não existe). Usado pelo admin.
    async update(id: number, dto: UpdateProfileDto) {
        const profile = await this.prisma.profile.findUnique({
            where: { id }
        });
        if (!profile) throw new NotFoundException('Perfil não encontrado.');
        return this.prisma.profile.update({
            where: { id },
            data: {
                fullName: dto.fullName,
                birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
                avatarUrl: dto.avatarUrl,
                weight: dto.weight,
                height: dto.height,
                sex: dto.sex,
                activityLevel: dto.activityLevel,
                goal: dto.goal,
            },
        });
    }

    // Apaga um perfil pelo id (404 se não existe).
    async remove(id: number) {
        const profile = await this.prisma.profile.findUnique({ where: { id } });
        if (!profile) throw new NotFoundException('Perfil não encontrado.');
        await this.prisma.profile.delete({ where: { id } });
    }

    // Monta o perfil no formato devolvido pela API (data em ISO e avatar vazio se não tiver).
    private format(p: any) {
        return {
            id: p.id,
            userId: p.userId,
            fullName: p.fullName,
            birthDate: p.birthDate?.toISOString(),
            avatarUrl: p.avatarUrl ?? '',
            weight: p.weight,
            height: p.height,
            sex: p.sex,
            activityLevel: p.activityLevel,
            goal: p.goal,
        };
    }

    // Devolve um perfil pelo id (404 se não existe).
    async findOne(id: number) {
        const p = await this.prisma.profile.findUnique({ where: { id } });
        if (!p) throw new NotFoundException('Perfil não encontrado.');
        return this.format(p);
    }

    // Devolve o perfil do usuário logado, com a meta diária de calorias (404 se não tem perfil).
    async findMe(userId: number) {
        const p = await this.prisma.profile.findUnique({ where: { userId } });
        if (!p) throw new NotFoundException('Perfil não encontrado.');
        return this.withDaily(p);
    }

    // Junta o perfil formatado com dailyCalories e missing (calculados em calcDaily).
    private withDaily(p: any) {
        return { ...this.format(p), ...calcDaily(p) };
    }

    // Cria ou atualiza o perfil do usuário logado (fullName é obrigatório na criação) e devolve com a meta diária.
    async upsertMe(userId: number, dto: UpdateProfileDto) {
        const existing = await this.prisma.profile.findUnique({ where: { userId } });
        if (!existing && !dto.fullName) {
            throw new BadRequestException('fullName é obrigatório para criar o perfil.');
        }
        const data = {
            fullName: dto.fullName,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
            avatarUrl: dto.avatarUrl,
            weight: dto.weight,
            height: dto.height,
            sex: dto.sex,
            activityLevel: dto.activityLevel,
            goal: dto.goal,
        };
        const p = await this.prisma.profile.upsert({
            where: { userId },
            update: data,
            create: { ...data, userId, fullName: dto.fullName ?? '' },
        });
        return this.withDaily(p);
    }
}