import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
export class CreateFoodLogDto {
  @IsOptional() @IsString() foodId?: string;
  @IsOptional() @IsString() mealId?: string;
  @Matches(/^(0|[1-9]\d*)(\.\d{1,3})?$/) quantity!: string;
  @IsDateString() eatenAt!: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
export class UpdateFoodLogDto extends CreateFoodLogDto {}
export class MarkEatenDto {
  @IsOptional() @Matches(/^(0|[1-9]\d*)(\.\d{1,3})?$/) quantity?: string;
  @IsOptional() @IsDateString() eatenAt?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

