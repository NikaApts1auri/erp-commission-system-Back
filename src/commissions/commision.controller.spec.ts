import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { Response } from 'express';

describe('CommissionsController', () => {
  let controller: CommissionsController;
  let service: Partial<CommissionsService>;

  beforeEach(async () => {
    service = {
      // mock for summary
      summary: jest.fn().mockResolvedValue({}),
      // mock for export
      export: jest
        .fn()
        .mockResolvedValue('Hotel,BookingId,Amount,AppliedRate,CalculatedAt\n'),
      // mock for agreement CRUD
      createAgreement: jest.fn().mockResolvedValue({}),
      getAgreement: jest.fn().mockResolvedValue({}),
      patchAgreement: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionsController],
      providers: [{ provide: CommissionsService, useValue: service }],
    }).compile();

    controller = module.get<CommissionsController>(CommissionsController);
  });

  it('should return summary via controller', async () => {
    const month = '2026-03';
    const result = await controller.summary(month);

    expect(service.summary).toHaveBeenCalledWith(month);
    expect(result).toEqual({});
  });

  it('should return export CSV via controller', async () => {
    const month = '2026-03';
    const res: Partial<Response> = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.export(month, res as Response);

    expect(service.export).toHaveBeenCalledWith(month);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      `attachment; filename="commissions-${month}.csv"`,
    );
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Hotel'));
  });

  it('should create agreement via controller', async () => {
    const hotelId = 'h1';
    const dto = { rate: 10 } as any;

    await controller.createAgreement(hotelId, dto);
    expect(service.createAgreement).toHaveBeenCalledWith(hotelId, dto);
  });

  it('should get agreement via controller', async () => {
    const hotelId = 'h1';

    await controller.getAgreement(hotelId);
    expect(service.getAgreement).toHaveBeenCalledWith(hotelId);
  });

  it('should patch agreement via controller', async () => {
    const hotelId = 'h1';
    const dto = { rate: 15 } as any;

    await controller.patchAgreement(hotelId, dto);
    expect(service.patchAgreement).toHaveBeenCalledWith(hotelId, dto);
  });
});
