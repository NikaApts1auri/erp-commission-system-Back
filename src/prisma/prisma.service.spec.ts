import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_URL: 'postgres://user:pass@localhost:5432/test',
    };

    service = new PrismaService();
    service.$connect = jest.fn().mockResolvedValue(undefined);
    service.$disconnect = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV; // აღვადგინე ძველი environment
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if DATABASE_URL is not set', () => {
    process.env = { ...ORIGINAL_ENV }; // წავშალe DATABASE_URL
    expect(() => new PrismaService()).toThrow('DATABASE_URL is not defined');
  });

  it('should call $connect on onModuleInit', async () => {
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalled();
  });

  it('should call $disconnect on onModuleDestroy', async () => {
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalled();
  });
});
