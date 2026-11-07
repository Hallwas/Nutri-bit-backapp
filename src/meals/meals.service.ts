import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateMealDto, IngredientDto } from 'src/dtos/create-meal-dto';
import { UpdateMealDto } from 'src/dtos/update-meal-dto';
import { calcIngredient, sumTotals } from 'src/meal-plans/meal-plans.service';

@Injectable()
export class MealsService {
    constructor(private prisma: PrismaService) { }

    // Devolve o id do perfil do usuário logado (404 se ainda não criou perfil).
    private async getProfileId(userId: number) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Perfil não encontrado. Crie seu perfil primeiro.');
        return profile.id;
    }

    // Garante que todos os alimentos (foodId) dos ingredientes existem (400 se algum não existe).
    private async checkFoods(ingredients: IngredientDto[]) {
        const ids = [...new Set(ingredients.map(i => i.foodId))];
        const found = await this.prisma.food.count({ where: { id: { in: ids } } });
        if (found !== ids.length) throw new BadRequestException('Alimento (foodId) não existe.');
    }

    // Converte os ingredientes do DTO para o formato gravado no banco.
    private ingredientsData(ingredients: IngredientDto[]) {
        return ingredients.map(i => ({
            foodId: i.foodId, quantity: i.quantity, unit: i.unit, grams: i.grams, note: i.note,
        }));
    }

    // Devolve a refeição com os ingredientes e os totais de calorias, proteínas e carboidratos.
    private async format(id: number) {
        const m = await this.prisma.meal.findUniqueOrThrow({
            where: { id },
            include: { ingredients: { orderBy: { id: 'asc' }, include: { food: true } } },
        });
        const ingredients = m.ingredients.map(i => ({
            id: i.id, quantity: i.quantity, unit: i.unit, grams: i.grams, note: i.note,
            food: { id: i.food.id, name: i.food.name },
            ...calcIngredient(i),
        }));
        return { id: m.id, dayId: m.dayId, name: m.name, type: m.type, time: m.time, ingredients, ...sumTotals(ingredients) };
    }

    // Cria uma refeição com seus ingredientes em um dia do usuário (404 se o dia não existe, 403 se é de outro).
    async create(userId: number, dayId: number, dto: CreateMealDto) {
        const profileId = await this.getProfileId(userId);
        const day = await this.prisma.day.findUnique({
            where: { id: dayId }, include: { week: { include: { mealPlan: true } } },
        });
        if (!day) throw new NotFoundException('Dia não encontrado.');
        if (day.week.mealPlan.profileId !== profileId) throw new ForbiddenException('Este dia é de outro usuário.');
        await this.checkFoods(dto.ingredients);
        const meal = await this.prisma.meal.create({
            data: {
                name: dto.name, type: dto.type, time: dto.time, dayId,
                ingredients: { create: this.ingredientsData(dto.ingredients) },
            },
        });
        return this.format(meal.id);
    }

    // Busca a refeição e confere se é do usuário logado (404 se não existe, 403 se é de outro).
    private async getOwnedMeal(userId: number, id: number) {
        const profileId = await this.getProfileId(userId);
        const meal = await this.prisma.meal.findUnique({
            where: { id }, include: { day: { include: { week: { include: { mealPlan: true } } } } },
        });
        if (!meal) throw new NotFoundException('Refeição não encontrada.');
        if (meal.day.week.mealPlan.profileId !== profileId) throw new ForbiddenException('Esta refeição é de outro usuário.');
        return meal;
    }

    // Altera a refeição; se vier a lista de ingredientes, troca todos os ingredientes antigos pelos novos.
    async update(userId: number, id: number, dto: UpdateMealDto) {
        await this.getOwnedMeal(userId, id);
        if (dto.ingredients) await this.checkFoods(dto.ingredients);
        await this.prisma.$transaction(async tx => {
            if (dto.ingredients) await tx.ingredient.deleteMany({ where: { mealId: id } });
            await tx.meal.update({
                where: { id },
                data: {
                    name: dto.name, type: dto.type, time: dto.time,
                    ingredients: dto.ingredients ? { create: this.ingredientsData(dto.ingredients) } : undefined,
                },
            });
        });
        return this.format(id);
    }

    // Apaga a refeição (e os ingredientes dela).
    async remove(userId: number, id: number) {
        await this.getOwnedMeal(userId, id);
        await this.prisma.meal.delete({ where: { id } });
    }
}
