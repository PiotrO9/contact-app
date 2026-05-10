import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  name!: string;
}
