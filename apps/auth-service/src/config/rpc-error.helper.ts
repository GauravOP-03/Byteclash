import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export function throwRpcError(
  message: string,
  statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  errors?: any[],
): never {
  throw new RpcException({
    statusCode,
    message,
    ...(errors && { errors }),
  });
}
