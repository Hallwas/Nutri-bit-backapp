import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateMealPlanDto } from 'src/dtos/create-meal-plan-dto';
import { UpdateMealPlanDto } from 'src/dtos/update-meal-plan-dto';
import { calcDaily } from 'src/profiles/daily-calories';

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// Arredonda para 1 casa decimal.
const round1 = (n: number) => Math.round(n * 10) / 10;

// Gramas do ingrediente: usa grams; se não tiver, usa quantity quando a unidade é g ou ml (senão 0).
export function gramsOf(ing: { quantity: number; unit: string; grams: number | null }): number {
    if (ing.grams != null) return ing.grams;
    const unit = ing.unit.trim().toLowerCase();
    if (unit === 'g' || unit === 'ml') return ing.quantity;
    return 0;
}

// Calcula calorias, proteínas e carboidratos do ingrediente (os valores do Food são por 100 g).
export function calcIngredient(ing: any) {
    const g = gramsOf(ing);
    const f = (v: number | null) => round1(((v ?? 0) * g) / 100);
    return {
        calorias: f(ing.food.calorias),
        proteinas: f(ing.food.proteinas),
        carboidratos: f(ing.food.carboidratosDisponiveis),
    };
}

// Soma calorias, proteínas e carboidratos de uma lista (ingredientes de uma refeição ou refeições de um dia).
export function sumTotals(list: { calorias: number; proteinas: number; carboidratos: number }[]) {
    return {
        calorias: round1(list.reduce((s, x) => s + x.calorias, 0)),
        proteinas: round1(list.reduce((s, x) => s + x.proteinas, 0)),
        carboidratos: round1(list.reduce((s, x) => s + x.carboidratos, 0)),
    };
}

@Injectable()
export class MealPlansService {
    constructor(private prisma: PrismaService) { }

    // Devolve o id do perfil do usuário logado (404 se ainda não criou perfil).
    private async getProfileId(userId: number) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Perfil não encontrado. Crie seu perfil primeiro.');
        return profile.id;
    }

    // Busca o plano e confere se é do usuário: 404 se não existe, 403 se é de outro ou se é um modelo.
    private async getOwnedPlan(userId: number, id: number) {
        const profileId = await this.getProfileId(userId);
        const plan = await this.prisma.mealPlan.findUnique({ where: { id } });
        if (!plan) throw new NotFoundException('Plano não encontrado.');
        if (plan.isTemplate) throw new ForbiddenException('Modelos não podem ser alterados.');
        if (plan.profileId !== profileId) throw new ForbiddenException('Este plano é de outro usuário.');
        return plan;
    }

    // Lista dos 7 dias da semana (Segunda a Domingo) com ordem 1 a 7, usada ao criar uma semana.
    private daysData() {
        return WEEKDAYS.map((weekday, i) => ({ weekday, order: i + 1 }));
    }

    // Lista os planos do usuário com o resumo (id, nome, objetivo, se está ativo e quantas semanas tem).
    async findAll(userId: number) {
        const profileId = await this.getProfileId(userId);
        const plans = await this.prisma.mealPlan.findMany({
            where: { profileId },
            include: { _count: { select: { weeks: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return plans.map(p => ({
            id: p.id, name: p.name, goal: p.goal, active: p.active, weeksCount: p._count.weeks,
        }));
    }

    // Lista os modelos do objetivo do usuário, do mais próximo da meta diária de calorias ao mais distante.
    // 400 se o perfil estiver incompleto (devolve o que falta em missing).
    async findTemplates(userId: number) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Perfil não encontrado. Crie seu perfil primeiro.');
        const { dailyCalories, missing } = calcDaily(profile);
        if (dailyCalories == null) {
            throw new BadRequestException({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Complete seu perfil para ver os planos sugeridos.',
                missing,
            });
        }
        const templates = await this.prisma.mealPlan.findMany({
            where: { isTemplate: true, goal: profile.goal as string },
            include: { _count: { select: { weeks: true } } },
        });
        const dist = (c: number | null) => (c == null ? Infinity : Math.abs(c - dailyCalories));
        templates.sort((a, b) => dist(a.calories) - dist(b.calories));
        return templates.map((t, i) => ({
            id: t.id,
            name: t.name,
            goal: t.goal,
            description: t.description,
            calories: t.calories,
            weeksCount: t._count.weeks,
            bestMatch: i === 0,
        }));
    }

    // Copia um modelo inteiro (semanas, dias, refeições e ingredientes) para o usuário como um plano novo e o devolve.
    async useTemplate(userId: number, templateId: number) {
        const profileId = await this.getProfileId(userId);
        const t = await this.prisma.mealPlan.findFirst({
            where: { id: templateId, isTemplate: true },
            include: {
                weeks: {
                    orderBy: { number: 'asc' },
                    include: { days: { orderBy: { order: 'asc' }, include: { meals: { include: { ingredients: true } } } } },
                },
            },
        });
        if (!t) throw new NotFoundException('Modelo não encontrado.');
        const plan = await this.prisma.$transaction(tx => tx.mealPlan.create({
            data: {
                name: t.name,
                goal: t.goal,
                description: t.description,
                calories: t.calories,
                isTemplate: false,
                active: false,
                profileId,
                weeks: {
                    create: t.weeks.map(w => ({
                        number: w.number,
                        label: w.label,
                        days: {
                            create: w.days.map(d => ({
                                weekday: d.weekday,
                                order: d.order,
                                meals: {
                                    create: d.meals.map(m => ({
                                        name: m.name, type: m.type, time: m.time,
                                        ingredients: {
                                            create: m.ingredients.map(i => ({
                                                foodId: i.foodId, quantity: i.quantity, unit: i.unit,
                                                grams: i.grams, note: i.note,
                                            })),
                                        },
                                    })),
                                },
                            })),
                        },
                    })),
                },
            },
        }));
        return this.findOne(userId, plan.id);
    }

    // Cria um plano com a Semana 1 e os 7 dias vazios e devolve o plano.
    async create(userId: number, dto: CreateMealPlanDto) {
        const profileId = await this.getProfileId(userId);
        const plan = await this.prisma.mealPlan.create({
            data: {
                name: dto.name,
                goal: dto.goal,
                description: dto.description,
                active: dto.active ?? false,
                profileId,
                weeks: { create: { number: 1, days: { create: this.daysData() } } },
            },
        });
        return this.findOne(userId, plan.id);
    }

    // Devolve o plano completo (semanas, dias, refeições e ingredientes) com os totais calculados.
    async findOne(userId: number, id: number) {
        await this.getOwnedPlan(userId, id);
        const plan = await this.prisma.mealPlan.findUniqueOrThrow({
            where: { id },
            include: {
                weeks: {
                    orderBy: { number: 'asc' },
                    include: {
                        days: {
                            orderBy: { order: 'asc' },
                            include: {
                                meals: {
                                    orderBy: { id: 'asc' },
                                    include: { ingredients: { orderBy: { id: 'asc' }, include: { food: true } } },
                                },
                            },
                        },
                    },
                },
            },
        });
        return {
            id: plan.id,
            name: plan.name,
            goal: plan.goal,
            description: plan.description,
            active: plan.active,
            weeks: plan.weeks.map(w => ({
                id: w.id,
                number: w.number,
                label: w.label,
                startDate: w.startDate,
                days: w.days.map(d => {
                    const meals = d.meals.map(m => {
                        const ingredients = m.ingredients.map(i => ({
                            id: i.id,
                            quantity: i.quantity,
                            unit: i.unit,
                            grams: i.grams,
                            note: i.note,
                            food: { id: i.food.id, name: i.food.name },
                            ...calcIngredient(i),
                        }));
                        return {
                            id: m.id, name: m.name, type: m.type, time: m.time,
                            ingredients, ...sumTotals(ingredients),
                        };
                    });
                    return { id: d.id, weekday: d.weekday, order: d.order, meals, ...sumTotals(meals) };
                }),
            })),
        };
    }

    // Altera nome, objetivo, descrição ou situação do plano e devolve o plano.
    async update(userId: number, id: number, dto: UpdateMealPlanDto) {
        await this.getOwnedPlan(userId, id);
        await this.prisma.mealPlan.update({
            where: { id },
            data: { name: dto.name, goal: dto.goal, description: dto.description, active: dto.active },
        });
        return this.findOne(userId, id);
    }

    // Apaga o plano (as semanas, dias, refeições e ingredientes saem junto).
    async remove(userId: number, id: number) {
        await this.getOwnedPlan(userId, id);
        await this.prisma.mealPlan.delete({ where: { id } });
    }

    // Apaga uma semana do plano (400 se for a única), renumera as seguintes e devolve o plano.
    async removeWeek(userId: number, id: number, weekId: number) {
        await this.getOwnedPlan(userId, id);
        const week = await this.prisma.week.findFirst({ where: { id: weekId, mealPlanId: id } });
        if (!week) throw new NotFoundException('Semana não encontrada neste plano.');
        const total = await this.prisma.week.count({ where: { mealPlanId: id } });
        if (total <= 1) throw new BadRequestException('O plano precisa ter pelo menos uma semana.');

        await this.prisma.$transaction(async tx => {
            await tx.week.delete({ where: { id: weekId } });
            const next = await tx.week.findMany({
                where: { mealPlanId: id, number: { gt: week.number } },
                orderBy: { number: 'asc' },
            });
            for (const w of next) {
                await tx.week.update({ where: { id: w.id }, data: { number: w.number - 1 } });
            }
        });
        return this.findOne(userId, id);
    }

    // Acrescenta uma semana nova (com os 7 dias vazios) no fim do plano e devolve o plano.
    async addWeek(userId: number, id: number) {
        await this.getOwnedPlan(userId, id);
        const last = await this.prisma.week.aggregate({ where: { mealPlanId: id }, _max: { number: true } });
        await this.prisma.week.create({
            data: {
                mealPlanId: id,
                number: (last._max.number ?? 0) + 1,
                days: { create: this.daysData() },
            },
        });
        return this.findOne(userId, id);
    }
}
