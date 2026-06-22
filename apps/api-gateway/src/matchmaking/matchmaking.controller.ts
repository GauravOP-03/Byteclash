import { Post, Controller, Inject, Req, UseGuards } from '@nestjs/common';
import { throwError, catchError, firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import handleRpcError from 'src/common/utils/handle-rpc-error';
interface UserResponse {
  id: string;
  email: string;
  name: string;
}
@Controller('matchmaking')
export class MatchmakingController {
  constructor(
    @Inject('MATCHMAKING_SERVICE')
    private readonly matchmakingClient: ClientProxy,

    @Inject('MATCHMAKING_SERVICE_REDIS')
    private readonly matchmakingClientRedis: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async matchmaking(@Req() request: Request) {
    const data = request['user'] as UserResponse;
    const result = await firstValueFrom(
      this.matchmakingClient
        .send('player_matchmaking', { user_id: data.id })
        .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
    );
    return result;
  }

  @Post('/score')
  @UseGuards(JwtAuthGuard)
  async score() {
    this.matchmakingClientRedis.emit('score_update', { data: 'data1232' });
    return { status: 'OK' };
  }
}
