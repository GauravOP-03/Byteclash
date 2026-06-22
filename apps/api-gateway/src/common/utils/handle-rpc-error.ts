import { HttpException, HttpStatus } from '@nestjs/common';
interface RpcErrorPayload {
  statusCode?: number;
  message?: string;
  errors?: unknown[];
}
export default function handleRpcError(err: RpcErrorPayload): never {
  const statusCode = err?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err?.message ?? 'Something went wrong';
  const errors = err?.errors;

  throw new HttpException(
    {
      statusCode,
      message,
      ...(errors && { errors }),
    },
    statusCode,
  );
}
