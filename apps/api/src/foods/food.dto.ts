import { FoodSource, ServingUnit } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
const decimal = /^(0|[1-9]\d*)(\.\d{1,3})?$/;
export class CreateFoodDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) brand?: string;
  @Matches(decimal) servingSize!: string;
  @IsEnum(ServingUnit) servingUnit!: ServingUnit;
  @Matches(decimal) calories!: string;
  @Matches(decimal) protein!: string;
  @Matches(decimal) carbs!: string;
  @Matches(decimal) fat!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class UpdateFoodDto extends CreateFoodDto {}
export class SearchFoodDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(FoodSource) source?: FoodSource;
}

