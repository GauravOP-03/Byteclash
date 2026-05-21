import { createZodValidationPipe } from 'nestjs-zod';
import { RpcException } from '@nestjs/microservices';

interface issueType {
  expected: string;
  code: string;
  path: string[];
  message: string;
}
export const ZodRpcValidationPipe = createZodValidationPipe({
  createValidationException: (error: { name: string; message: string }) => {
    const issues = JSON.parse(error.message) as issueType[];

    return new RpcException({
      statusCode: 422,
      message: 'Validation failed',
      errors: issues,
    });
  },
});
