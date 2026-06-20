import { FoodSource, ServingUnit } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { DECIMAL_PATTERN, POSITIVE_DECIMAL_PATTERN } from '@diet/shared';
export class CreateFoodDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) brand?: string;
  @Matches(POSITIVE_DECIMAL_PATTERN) servingSize!: string;
  @IsEnum(ServingUnit) servingUnit!: ServingUnit;
  @Matches(DECIMAL_PATTERN) calories!: string;
  @Matches(DECIMAL_PATTERN) protein!: string;
  @Matches(DECIMAL_PATTERN) carbs!: string;
  @Matches(DECIMAL_PATTERN) fat!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class UpdateFoodDto extends CreateFoodDto {}
export class SearchFoodDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(FoodSource) source?: FoodSource;
}

