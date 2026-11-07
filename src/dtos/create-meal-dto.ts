import { Type } from 'class-transformer';
import {
    IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length,
    Matches, MaxLength, ValidateNested
} from 'class-validator';

export class IngredientDto {
    @IsInt()
    @IsPositive()
    foodId: number = 0;

    @IsNumber()
    @IsPositive()
    quantity: number = 0;

    @IsString()
    @MaxLength(30)
    unit: string = "";

    // peso total em gramas
    @IsOptional()
    @IsNumber()
    @IsPositive()
    grams?: number;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    note?: string;
}

export class CreateMealDto {
    @IsString()
    @Length(2, 120)
    name: string = "";

    @IsString()
    @Length(2, 50)
    type: string = "";

    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time deve estar no formato HH:mm' })
    time?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    ingredients: IngredientDto[] = [];
}
