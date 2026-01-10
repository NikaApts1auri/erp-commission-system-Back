import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HotelsController],
  providers: [HotelsService],
})
export class HotelsModule {}
