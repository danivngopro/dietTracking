import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { POSITIVE_DECIMAL_PATTERN } from '@diet/shared';
class MealItemDto { @IsString() foodId!: string; @Matches(POSITIVE_DECIMAL_PATTERN) quantity!: string }
export class CreateMealDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => MealItemDto) items!: MealItemDto[];
}
export class UpdateMealDto extends CreateMealDto {}

