import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
class MealItemDto { @IsString() foodId!: string; @Matches(/^(0|[1-9]\d*)(\.\d{1,3})?$/) quantity!: string }
export class CreateMealDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => MealItemDto) items!: MealItemDto[];
}
export class UpdateMealDto extends CreateMealDto {}

