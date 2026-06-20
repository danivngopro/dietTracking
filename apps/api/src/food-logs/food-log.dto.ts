import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { POSITIVE_DECIMAL_PATTERN } from '@diet/shared';
export class CreateFoodLogDto {
  @IsOptional() @IsString() foodId?: string;
  @IsOptional() @IsString() mealId?: string;
  @Matches(POSITIVE_DECIMAL_PATTERN) quantity!: string;
  @IsDateString() eatenAt!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class UpdateFoodLogDto extends CreateFoodLogDto {}
export class MarkEatenDto {
  @IsOptional() @Matches(POSITIVE_DECIMAL_PATTERN) quantity?: string;
  @IsOptional() @IsDateString() eatenAt?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

