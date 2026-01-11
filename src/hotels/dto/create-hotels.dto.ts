import { IsString, IsEnum, IsOptional } from 'class-validator';
import { HotelStatus } from '@prisma/client';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(HotelStatus)
  status?: HotelStatus;
}
