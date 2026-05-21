import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ZodRpcValidationPipe } from './config/zod-rpc-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 8877,
      },
    },
  );

  app.useGlobalPipes(new ZodRpcValidationPipe());

  await app.listen();
  Logger.log('Auth Service is Listening on port 8877');
}
bootstrap();
