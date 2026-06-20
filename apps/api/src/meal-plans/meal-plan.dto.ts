import { MealLabel } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
export class PlanItemDto {
  @IsOptional() @IsString() foodId?: string;
  @IsOptional() @IsString() mealId?: string;
  @Matches(/^(0|[1-9]\d*)(\.\d{1,3})?$/) quantity!: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) plannedTime?: string;
  @IsOptional() @IsEnum(MealLabel) mealLabel?: MealLabel;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class CreateMealPlanDto {
  @IsString() @MaxLength(120) name!: string;
  @IsDateString({ strict: true }) date!: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => PlanItemDto) items!: PlanItemDto[];
}
export class UpdateMealPlanDto extends CreateMealPlanDto {}

