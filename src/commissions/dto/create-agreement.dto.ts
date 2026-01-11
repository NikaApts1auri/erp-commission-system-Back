import {
  IsEnum,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ValidateIf,
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

  @ValidateIf((o) => o.type === CommissionType.PERCENTAGE)
  @IsNumber()
  baseRate!: number;

  @ValidateIf((o) => o.type === CommissionType.FLAT)
  @IsNumber()
  flatFee!: number;

  @IsOptional()
  @IsNumber()
  preferredBonus?: number;

  @ValidateIf((o) => o.type === CommissionType.TIERED)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  tiers!: TierDto[];
}
