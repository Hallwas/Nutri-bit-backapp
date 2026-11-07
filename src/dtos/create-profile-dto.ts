import { IsNumber, Min, Max, IsIn } from 'class-validator';
import { ACTIVITY_LEVELS, GOALS, SEXES } from './goals';
import {
    IsInt, IsPositive, IsString, Length, IsOptional, IsDateString,
    IsUrl, MaxLength
} from 'class-validator';
export class CreateProfileDto {
    @IsInt()
    @IsPositive()
    userId: number = 0; // vínculo obrigatório

    @IsString()
    @Length(2, 120)
    fullName: string = "";

    @IsOptional()
    @IsDateString()
    birthDate?: string; // ISO 8601 (ex: "1990-01-15T00:00:00Z")
    
    @IsOptional()
    @MaxLength(500)
    avatarUrl?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(500)
    weight?: number; // kg

    @IsOptional()
    @IsNumber()
    @Min(30)
    @Max(300)
    height?: number; // cm

    @IsOptional()
    @IsIn(SEXES)
    sex?: string; // M | F

    @IsOptional()
    @IsIn(ACTIVITY_LEVELS)
    activityLevel?: string;

    @IsOptional()
    @IsIn(GOALS)
    goal?: string;
}
