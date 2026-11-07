import { IsIn, IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { GOALS } from './goals';

export class UpdateMealPlanDto {
    @IsOptional()
    @IsString()
    @Length(2, 120)
    name?: string;

    @IsOptional()
    @IsIn(GOALS)
    goal?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
