import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Query,
} from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';

@Controller()
export class CommissionsController {
  constructor(private readonly service: CommissionsService) {}

  // Commission Agreement endpoints
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

  // Calculate commission
  @Post('bookings/:id/calculate-commission')
  calculate(@Param('id') bookingId: string) {
    return this.service.calculateCommission(bookingId);
  }

  // Monthly summary
  @Get('commissions/summary')
  summary(@Query('month') month: string) {
    return this.service.summary(month);
  }
}
