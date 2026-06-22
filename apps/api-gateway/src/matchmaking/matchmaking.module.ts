import { Module } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MATCHMAKING_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 4002,
        },
      },
      {
        name: 'MATCHMAKING_SERVICE_REDIS',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),
  ],
  controllers: [MatchmakingController],
  providers: [],
})
export class MatchmakingModule {}
