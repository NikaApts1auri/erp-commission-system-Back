import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { HotelsModule } from './hotels/hotels.module';
import { CommissionsModule } from './commissions/commissions.module';
import { BookingsModule } from './bookings/bookings.module';
import { BookingsController } from './bookings/bookings.controller';
import { BookingsService } from './bookings/bookings.service';
import { CommissionsController } from './commissions/commissions.controller';
import { CommissionsService } from './commissions/commissions.service';
import { HotelsController } from './hotels/hotels.controller';
import { HotelsService } from './hotels/hotels.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HotelsModule,
    CommissionsModule,
    BookingsModule,
  ],
  controllers: [BookingsController, HotelsController, CommissionsController],
  providers: [
    BookingsService,
    HotelsService,
    CommissionsService,
    PrismaService,
  ],
})
export class AppModule {}
