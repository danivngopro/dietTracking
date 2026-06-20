import { IsString } from 'class-validator';
export class UpdateProfileDto { @IsString() timezone!: string }

