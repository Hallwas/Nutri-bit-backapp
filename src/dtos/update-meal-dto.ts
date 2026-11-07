import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, Length, Matches, ValidateNested } from 'class-validator';
import { IngredientDto } from './create-meal-dto';

export class UpdateMealDto {
    @IsOptional()
    @IsString()
    @Length(2, 120)
    name?: string;

    @IsOptional()
    @IsString()
    @Length(2, 50)
    type?: string;

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time deve estar no formato HH:mm' })
    time?: string;

    // se enviado, substitui todos os ingredientes da refeição
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    ingredients?: IngredientDto[];
}
