import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ===== Request ID =====
  app.use((req, res, next) => {
    const id = randomUUID();
    req['requestId'] = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // ===== Logging =====
  app.use(
    morgan(':method :url :status :response-time ms - :req[x-request-id]'),
  );

  // ===== Security =====
  app.use(helmet());

  // ===== Validation =====
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ===== Versioning =====
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // ===== Global prefix =====
  app.setGlobalPrefix('api');

  // ===== Graceful shutdown =====
  const server = app.getHttpServer();

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown); //როცა დოკერი ჩერდებ
  process.on('SIGINT', shutdown);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
