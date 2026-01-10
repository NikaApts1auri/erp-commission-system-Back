import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionType } from '@prisma/client';

export class TierDto {
  @IsNumber()
  minBookings: number;

  @IsNumber()
  bonusRate: number;
}

export class CreateAgreementDto {
  @IsEnum(CommissionType)
  type: CommissionType;

  @IsOptional()
  @IsNumber()
  baseRate?: number; // percentage e.g., 0.1 = 10%

  @IsOptional()
  @IsNumber()
  flatFee?: number;

  @IsOptional()
  @IsNumber()
  preferredBonus?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  tiers: TierDto[];
}
