import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { Decimal } from '@prisma/client/runtime/wasm-compiler-edge';
import { Response } from 'express';

describe('CommissionsController', () => {
  let controller: CommissionsController;
  let service: Partial<CommissionsService>;

  beforeEach(async () => {
    service = {
      calculateCommission: jest.fn().mockResolvedValue({
        amount: new Decimal(120),
        breakdown: {},
      }),
      summary: jest.fn().mockResolvedValue({}),
      export: jest
        .fn()
        .mockResolvedValue('Hotel,BookingId,Amount,CalculatedAt\n'),
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

  it('should calculate commission via controller', async () => {
    const result = await controller.calculate('b1');

    expect(result.amount.toNumber()).toBe(120);
    expect(service.calculateCommission).toHaveBeenCalledWith('b1');
  });

  it('should return summary via controller', async () => {
    const month = '2026-03';
    const result = await controller.summary(month);

    expect(result).toEqual({});
    expect(service.summary).toHaveBeenCalledWith(month);
  });

  it('should return export CSV via controller', async () => {
    const month = '2026-03';

    // mock express.Response
    const res: Partial<Response> = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.export(month, res as Response);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      `attachment; filename="commissions-${month}.csv"`,
    );
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Hotel'));
    expect(service.export).toHaveBeenCalledWith(month);
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
