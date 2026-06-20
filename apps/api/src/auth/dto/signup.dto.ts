import { IsEmail, IsString, MinLength } from 'class-validator';
export class SignupDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(10) password!: string;
}

