import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotels.dto';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  // ===== Create Hotel =====
  @Post()
  createHotel(@Body() dto: CreateHotelDto) {
    return this.hotelsService.createHotel(dto);
  }

  // ===== List all Hotels =====
  @Get()
  listHotels() {
    return this.hotelsService.listHotels();
  }

  // ===== Get single Hotel by ID =====
  @Get(':id')
  getHotel(@Param('id') id: string) {
    return this.hotelsService.getHotel(id);
  }

  // ===== Update Hotel =====
  @Patch(':id')
  updateHotel(@Param('id') id: string, @Body() dto: CreateHotelDto) {
    return this.hotelsService.updateHotel(id, dto);
  }

  // ===== Delete Hotel =====
  @Delete(':id')
  deleteHotel(@Param('id') id: string) {
    return this.hotelsService.deleteHotel(id);
  }
}
