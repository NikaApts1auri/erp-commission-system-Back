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

  @Post()
  createHotel(@Body() dto: CreateHotelDto) {
    return this.hotelsService.createHotel(dto);
  }

  @Get()
  listHotels() {
    return this.hotelsService.listHotels();
  }

  @Get(':id')
  getHotel(@Param('id') id: string) {
    return this.hotelsService.getHotel(id);
  }

  @Patch(':id')
  updateHotel(@Param('id') id: string, @Body() dto: CreateHotelDto) {
    return this.hotelsService.updateHotel(id, dto);
  }

  @Delete(':id')
  deleteHotel(@Param('id') id: string) {
    return this.hotelsService.deleteHotel(id);
  }
}
