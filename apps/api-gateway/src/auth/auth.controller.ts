import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import * as validationTypes from '@repo/validation-types';
import express from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import handleRpcError from 'src/common/utils/handle-rpc-error';
interface UserResponse {
  id: string;
  email: string;
  name: string;
}
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: express.Request) {
    const data = request['user'] as UserResponse;
    return { name: data.name, email: data.email, id: data.id };
  }

  @Get()
  hello() {
    return 'Hello';
  }

  @Post('login')
  async login(
    @Body() body: validationTypes.loginSchemaType,
    @Res({ passthrough: true }) response: express.Response,
  ): Promise<{ success: boolean; access_token: string }> {
    const data: {
      success: boolean;
      access_token: string;
      refresh_token: string;
    } = await firstValueFrom(
      this.authClient
        .send('auth-login', body)
        .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
    );

    response.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    return { success: data.success, access_token: data.access_token };
  }

  @Post('signup')
  async signup(
    @Body() signupData: validationTypes.signupBodyType,
  ): Promise<{ otp: string; otp_expires_at: string }> {
    console.log('data');
    const data: { otp: string; otp_expires_at: string } = await firstValueFrom(
      this.authClient
        .send('auth-signup', signupData)
        .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
    );

    return data;
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyData: validationTypes.verifyOtpType,
    @Res({ passthrough: true }) response: express.Response,
  ): Promise<{ verify: boolean; access_token: string }> {
    const data: {
      verified: boolean;
      access_token: string;
      refresh_token: string;
    } = await firstValueFrom(
      this.authClient
        .send('auth-validate-otp', verifyData)
        .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
    );

    response.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });

    return { verify: data.verified, access_token: data.access_token };
  }

  @Post('resend-otp')
  async resendOtp(
    @Body() resendData: validationTypes.resendOtpType,
  ): Promise<{ otp_expires_at: string }> {
    const data: { otp_expires_at: string } = await firstValueFrom(
      this.authClient
        .send('auth-resend-otp', resendData)
        .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
    );

    console.log(data);
    return data;
  }

  @Post('refresh')
  async refresh(@Req() request: express.Request) {
    const token: string = request.cookies['refresh_token'] as string;
    console.log(token);
    const data: { access_token: string } = await firstValueFrom(
      this.authClient
        .send('auth-refresh-token', token)
        .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
    );

    return data;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('refresh_token');
    return { message: 'log out successfully' };
  }

  @Post('google-login')
  async googleLogin(
    @Body() token: { token: string },
    @Res({ passthrough: true }) response: express.Response,
  ) {
    console.log(token);
    const data: {
      verified: boolean;
      access_token: string;
      refresh_token: string;
    } = await firstValueFrom(
      this.authClient
        .send('auth-google-login', token)
        .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
    );

    response.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });

    return { verify: data.verified, access_token: data.access_token };
  }
  @Get('github')
  githubLogin(@Res() res: express.Response) {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: process.env.GITHUB_CALLBACK_URL!,
      scope: 'user:email',
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }

  @Get('callback/github')
  async githubCallback(
    @Query('code') code: string,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );
    console.log(code);
    const { access_token: githubToken } = await tokenRes.json();
    console.log(githubToken);
    const data: { access_token: string; refresh_token: string } =
      await firstValueFrom(
        this.authClient
          .send('auth-github-login', githubToken)
          .pipe(catchError((err) => throwError(() => handleRpcError(err)))),
      );
    response.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    // Redirect to frontend with access_token in query (or use a cookie)
    return response.redirect(`http://localhost:3000/dashboard`);
  }
}
