import { Controller, UsePipes } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import * as validationTypes from '@repo/validation-types';
import { ZodRpcValidationPipe } from './config/zod-rpc-validation.pipe';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('auth-login')
  @UsePipes(new ZodRpcValidationPipe(validationTypes.loginSchema))
  async login(@Payload() credential: validationTypes.loginSchemaType) {
    return this.appService.login(credential);
  }

  @MessagePattern('auth-signup')
  @UsePipes(new ZodRpcValidationPipe(validationTypes.signupBody))
  async signup(@Payload() credential: validationTypes.signupBodyType) {
    console.log(credential);
    console.log('data2');
    return this.appService.signup(credential);
  }

  @MessagePattern('auth-validate-otp')
  @UsePipes(new ZodRpcValidationPipe(validationTypes.verifyOtpSchema))
  async verifyOtp(credential: validationTypes.verifyOtpType) {
    return this.appService.validateOtp(credential);
  }

  @MessagePattern('auth-refresh-token')
  async refresh(credential: { access_token: string }) {
    console.log(credential);
    return this.appService.getAccessToken(credential.access_token);
  }
}
