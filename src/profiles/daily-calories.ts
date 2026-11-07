const ACTIVITY_FACTOR: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725,
};
const GOAL_ADJUST: Record<string, number> = {
    lose: -500, maintain: 0, gain: 300, eat_better: 0,
};

// formula usada para calcular a taxa metabólica basal. Devolve a meta (ou null) e o que falta no perfil.
export function calcDaily(p: {
    weight: number | null; height: number | null; birthDate: Date | null;
    sex: string | null; activityLevel: string | null; goal: string | null;
}) {
    const missing: string[] = [];
    if (p.weight == null) missing.push('weight');
    if (p.height == null) missing.push('height');
    if (!p.birthDate) missing.push('birthDate');
    if (!p.sex) missing.push('sex');
    if (!p.activityLevel) missing.push('activityLevel');
    if (!p.goal) missing.push('goal');
    if (missing.length) return { dailyCalories: null, missing };

    const hoje = new Date();
    const nasc = p.birthDate as Date;
    let age = hoje.getFullYear() - nasc.getFullYear();
    const fezAniversario = hoje.getMonth() > nasc.getMonth()
        || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate());
    if (!fezAniversario) age--;

    // Não é o calculo correto, varia de acordo com o a idade e se é homem ou mulher
    const tmb = 10 * (p.weight as number) + 6.25 * (p.height as number) - 5 * age
        + (p.sex === 'M' ? 5 : -161);
    const gasto = tmb * ACTIVITY_FACTOR[p.activityLevel as string];
    const meta = gasto + GOAL_ADJUST[p.goal as string];
    return { dailyCalories: Math.round(meta / 10) * 10, missing };
}
