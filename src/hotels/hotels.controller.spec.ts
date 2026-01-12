import { Test, TestingModule } from '@nestjs/testing';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotels.dto';

describe('HotelsController', () => {
  let controller: HotelsController;
  let service: Partial<HotelsService>;

  beforeEach(async () => {
    service = {
      createHotel: jest.fn().mockImplementation((dto: CreateHotelDto) => ({
        id: 'h1',
        ...dto,
      })),
      listHotels: jest.fn().mockResolvedValue([
        { id: 'h1', name: 'Hotel One', location: 'City A' },
        { id: 'h2', name: 'Hotel Two', location: 'City B' },
      ]),
      getHotel: jest.fn().mockImplementation((id: string) => ({
        id,
        name: 'Hotel One',
        location: 'City A',
      })),
      updateHotel: jest
        .fn()
        .mockImplementation((id: string, dto: CreateHotelDto) => ({
          id,
          ...dto,
        })),
      deleteHotel: jest.fn().mockImplementation((id: string) => ({
        id,
        deleted: true,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [{ provide: HotelsService, useValue: service }],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
  });

  it('should create a hotel', async () => {
    const dto: CreateHotelDto = { name: 'Hotel One' };
    const result = await controller.createHotel(dto);
    expect(result).toEqual({ id: 'h1', ...dto });
    expect(service.createHotel).toHaveBeenCalledWith(dto);
  });

  it('should list all hotels', async () => {
    const result = await controller.listHotels();
    expect(result.length).toBe(2);
    expect(service.listHotels).toHaveBeenCalled();
  });

  it('should get a single hotel by ID', async () => {
    const result = await controller.getHotel('h1');
    expect(result).toEqual({ id: 'h1', name: 'Hotel One', location: 'City A' });
    expect(service.getHotel).toHaveBeenCalledWith('h1');
  });

  it('should update a hotel', async () => {
    const dto: CreateHotelDto = { name: 'Hotel Updated' };
    const result = await controller.updateHotel('h1', dto);
    expect(result).toEqual({ id: 'h1', ...dto });
    expect(service.updateHotel).toHaveBeenCalledWith('h1', dto);
  });

  it('should delete a hotel', async () => {
    const result = await controller.deleteHotel('h1');
    expect(result).toEqual({ id: 'h1', deleted: true });
    expect(service.deleteHotel).toHaveBeenCalledWith('h1');
  });
});
