import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

// Arredonda para 1 casa decimal.
const round1 = (n: number) => Math.round(n * 10) / 10;

type Nutrientes = { name: string; calorias: number | null; proteinas: number | null; carboidratosDisponiveis: number | null };

// Distância entre dois alimentos (menor = mais parecidos): soma da diferença relativa de calorias, proteínas e carboidratos.
// max(valor, 1) evita dividir por zero e nutrientes nulos contam como 0.
export function distancia(a: Nutrientes, b: Nutrientes): number {
    const kcalA = a.calorias ?? 0;
    const protA = a.proteinas ?? 0;
    const carbA = a.carboidratosDisponiveis ?? 0;

    let d = Math.abs(kcalA - (b.calorias ?? 0)) / Math.max(kcalA, 1)
        + Math.abs(protA - (b.proteinas ?? 0)) / Math.max(protA, 1)
        + Math.abs(carbA - (b.carboidratosDisponiveis ?? 0)) / Math.max(carbA, 1);

    // Bônus: mesma primeira palavra no nome ("Pão integral" e "Pão de forma") deixa os dois mais parecidos.
    const primeira = (nome: string) => nome.trim().split(/[\s,]+/)[0].toLowerCase();
    if (primeira(a.name) === primeira(b.name)) d = Math.max(d - 0.3, 0);

    return d;
}

// Grupos que só entram como sugestão quando o alimento original é do mesmo grupo.
const GRUPOS_EXCLUIDOS = ['Gorduras e óleos', 'Açúcares e doces', 'Alimentos para fins especiais', 'Miscelâneas', 'Fast food'];

// Itens que dificilmente entram numa refeição (dados importados, caldo em tablete).
const ehItemRuim = (nome: string) => /dado importad|tablete/i.test(nome);

@Injectable()
export class FoodsService {
    constructor(private prisma: PrismaService) { }

    // Busca até 20 alimentos cujo nome contém o texto (ou os 20 primeiros, se não vier texto).
    async search(search?: string) {
        return this.prisma.food.findMany({
            where: search ? { name: { contains: search } } : undefined,
            select: { id: true, name: true, calorias: true, proteinas: true, carboidratosDisponiveis: true },
            orderBy: { name: 'asc' },
            take: 20,
        });
    }

    // Sugere alimentos parecidos com o do id (do mesmo grupo) e quantos gramas dão as mesmas calorias.
    // Usado quando o usuário remove um ingrediente da refeição.
    async findSimilar(id: number, gramsText?: string, limitText?: string) {
        const grams = gramsText === undefined ? 100 : Number(gramsText);
        if (!Number.isFinite(grams) || grams <= 0) {
            throw new BadRequestException('grams deve ser um número maior que 0.');
        }
        const limitNum = limitText === undefined ? 3 : Number(limitText);
        if (!Number.isInteger(limitNum) || limitNum <= 0) {
            throw new BadRequestException('limit deve ser um número inteiro maior que 0.');
        }
        const limit = Math.min(limitNum, 10);

        const food = await this.prisma.food.findUnique({ where: { id } });
        if (!food) throw new NotFoundException('Alimento não encontrado.');
        if (food.calorias == null) {
            throw new BadRequestException('Este alimento não tem calorias cadastradas, não dá para comparar.');
        }

        // Candidatos: do mesmo grupo (ou de qualquer grupo não excluído, se o alimento não tem grupo),
        // com calorias e sem o próprio alimento.
        const candidatos = (await this.prisma.food.findMany({
            where: {
                id: { not: id },
                calorias: { gt: 0 },
                ...(food.grupo ? { grupo: food.grupo } : { NOT: { grupo: { in: GRUPOS_EXCLUIDOS } } }),
            },
            select: { id: true, name: true, calorias: true, proteinas: true, carboidratosDisponiveis: true },
        })).filter(c => !ehItemRuim(c.name));

        const caloriasOriginais = (food.calorias * grams) / 100;
        const similar = candidatos
            .map(c => ({ c, d: distancia(food, c) }))
            .sort((x, y) => x.d - y.d)
            .slice(0, limit)
            .map(({ c }) => {
                const gramasEquivalentes = Math.round((caloriasOriginais / (c.calorias as number)) * 100);
                return {
                    id: c.id,
                    name: c.name,
                    calorias: c.calorias,
                    proteinas: c.proteinas,
                    carboidratosDisponiveis: c.carboidratosDisponiveis,
                    grams: gramasEquivalentes,
                    caloriasEquivalentes: round1(((c.calorias as number) * gramasEquivalentes) / 100),
                };
            });

        return {
            food: { id: food.id, name: food.name, grams, calorias: round1(caloriasOriginais) },
            similar,
        };
    }
}
