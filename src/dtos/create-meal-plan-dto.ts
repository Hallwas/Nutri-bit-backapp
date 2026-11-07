import { IsIn, IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { GOALS } from './goals';

export class CreateMealPlanDto {
    @IsString()
    @Length(2, 120)
    name: string = "";

    @IsIn(GOALS)
    goal: string = "";

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
