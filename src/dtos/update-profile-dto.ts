import { IsNumber, Min, Max, IsIn } from 'class-validator';
import { ACTIVITY_LEVELS, GOALS, SEXES } from './goals';
import { IsOptional, IsString, Length, IsDateString, IsUrl, MaxLength } from
    'class-validator';
export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Length(2, 120)
    fullName?: string;

    @IsOptional()
    @IsDateString()
    birthDate?: string;
    
    @IsOptional()
    @MaxLength(500)
    avatarUrl?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(500)
    weight?: number;

    @IsOptional()
    @IsNumber()
    @Min(30)
    @Max(300)
    height?: number;

    @IsOptional()
    @IsIn(SEXES)
    sex?: string;

    @IsOptional()
    @IsIn(ACTIVITY_LEVELS)
    activityLevel?: string;

    @IsOptional()
    @IsIn(GOALS)
    goal?: string;
}
