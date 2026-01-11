import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CommissionsService } from './commissions.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';

@Controller('commissions')
export class CommissionsController {
  constructor(private readonly service: CommissionsService) {}

  @Post('hotels/:id/commission-agreement')
  createAgreement(
    @Param('id') hotelId: string,
    @Body() dto: CreateAgreementDto,
  ) {
    return this.service.createAgreement(hotelId, dto);
  }

  @Get('hotels/:id/commission-agreement')
  getAgreement(@Param('id') hotelId: string) {
    return this.service.getAgreement(hotelId);
  }

  @Patch('hotels/:id/commission-agreement')
  patchAgreement(
    @Param('id') hotelId: string,
    @Body() dto: CreateAgreementDto,
  ) {
    return this.service.patchAgreement(hotelId, dto);
  }

  @Post('bookings/:id/calculate-commission')
  calculate(@Param('id') bookingId: string) {
    return this.service.calculateCommission(bookingId);
  }

  @Get('summary')
  summary(@Query('month') month: string) {
    if (!month) {
      throw new BadRequestException('month is required (YYYY-MM)');
    }
    return this.service.summary(month);
  }

  @Get('export')
  async export(@Query('month') month: string, @Res() res: Response) {
    if (!month) {
      throw new BadRequestException('month is required (YYYY-MM)');
    }

    const csv = await this.service.export(month);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="commissions-${month}.csv"`,
    );

    res.send(csv);
  }
}
