import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty({ message: 'E-mail jest wymagany' })
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;
}
