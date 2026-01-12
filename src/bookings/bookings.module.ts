import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionsModule } from 'src/commissions/commissions.module';

@Module({
  imports: [CommissionsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
