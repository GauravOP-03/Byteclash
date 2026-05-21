import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import type {
  loginSchemaType,
  signupBodyType,
  verifyOtpType,
} from '@repo/validation-types';
import express from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface RpcErrorPayload {
  statusCode?: number;
  message?: string;
  errors?: unknown[];
}
interface UserResponse {
  id: string;
  email: string;
}
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  private handleRpcError(err: RpcErrorPayload): never {
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: express.Request) {
    return request['user'] as UserResponse;
  }

  @Get()
  hello() {
    return 'Hello';
  }

  @Post('login')
  async login(
    @Body() body: loginSchemaType,
    @Res({ passthrough: true }) response: express.Response,
  ): Promise<{ success: boolean }> {
    const data: {
      success: boolean;
      access_token: string;
      refresh_token: string;
    } = await firstValueFrom(
      this.authClient
        .send('auth-login', body)
        .pipe(catchError((err) => throwError(() => this.handleRpcError(err)))),
    );

    response.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000,
    });

    response.cookie('access_token', data.access_token, {
      httpOnly: true,
      path: '/',
    });

    return { success: data.success };
  }
  @Post('signup')
  async signup(
    @Body() signupData: signupBodyType,
  ): Promise<{ otp: string; otp_expires_at: string }> {
    console.log('data');
    const data: { otp: string; otp_expires_at: string } = await firstValueFrom(
      this.authClient
        .send('auth-signup', signupData)
        .pipe(catchError((err) => throwError(() => this.handleRpcError(err)))),
    );

    return data;
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyData: verifyOtpType,
    @Res({ passthrough: true }) response: express.Response,
  ): Promise<{ verify: boolean }> {
    const data: {
      verified: boolean;
      access_token: string;
      refresh_token: string;
    } = await firstValueFrom(
      this.authClient.send('auth-validate-otp', verifyData).pipe(
        catchError((err) => {
          console.error(err);
          return throwError(() => new BadRequestException(err));
        }),
      ),
    );

    response.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });

    return { verify: data.verified };
  }

  @Post('refresh')
  async refresh(@Body() refresh_token: string) {
    const data: { access_token: string } = await firstValueFrom(
      this.authClient
        .send('auth-refresh-token', refresh_token)
        .pipe(catchError((err) => throwError(() => this.handleRpcError(err)))),
    );

    return data;
  }
}
