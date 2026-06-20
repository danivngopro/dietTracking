import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
const decimal = /^(0|[1-9]\d*)(\.\d{1,3})?$/;
export class UpsertTargetDto {
  @Matches(decimal) calories!: string;
  @Matches(decimal) protein!: string;
  @Matches(decimal) carbs!: string;
  @Matches(decimal) fat!: string;
  @IsOptional() @Matches(decimal) currentWeight?: string;
  @IsOptional() @Matches(decimal) goalWeight?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

