import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: '*',
    credentials: true,
  });
  // app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
  Logger.log('Gateway is running at 3001');
}
bootstrap();
