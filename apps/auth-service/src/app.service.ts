import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DB_CONNECTION } from './database/database.module';
import { Kysely } from 'kysely';
import { Database } from '@repo/database';
import {
  loginSchemaType,
  signupBodyType,
  verifyOtpType,
} from '@repo/validation-types';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { EmailService } from './email/email.service';
import { v4 as uuidv4 } from 'uuid';
import { throwRpcError } from './config/rpc-error.helper';

@Injectable()
export class AppService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Kysely<Database>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(data: loginSchemaType) {
    const { email, password } = data;
    const existingUser = await this.db
      .selectFrom('auth.users')
      .select(['id', 'email', 'email_verified'])
      .where('email', '=', email)
      .executeTakeFirst();

    if (!existingUser) {
      throwRpcError('User Does not exist', HttpStatus.NOT_FOUND);
    }
    if (!existingUser.email_verified) {
      await this.generateOtp(email, existingUser.id);
      throwRpcError('verify email otp send', HttpStatus.FORBIDDEN);
    }

    const user = await this.db
      .selectFrom('auth.accounts')
      .selectAll()
      .where('user_id', '=', existingUser.id)
      .executeTakeFirst();

    if (user?.provider != 'email') {
      throwRpcError(
        'Email is registered through another login method',
        HttpStatus.CONFLICT, // This is the standard 409 error
      );
    }

    const passwordMatch = await bcrypt.compare(password, user?.hash_password);
    if (!passwordMatch) {
      throwRpcError('Incorrect Password', HttpStatus.UNAUTHORIZED);
    }

    const access_token = await this.generateAccessToken(existingUser.id, email);
    const refresh_token = await this.generateRefreshToken(existingUser.id);
    return {
      success: true,
      access_token: access_token,
      refresh_token: refresh_token,
    };
  }

  async signup(credential: signupBodyType) {
    const { email, password } = credential;
    console.log(email, password);
    const existingUser = await this.db
      .selectFrom('auth.users')
      .select('email')
      .where('email', '=', email)
      .executeTakeFirst();

    if (existingUser) throwRpcError('User already exists', HttpStatus.CONFLICT);
    const hashPassword = await bcrypt.hash(password, 13);
    const newUser = await this.db
      .insertInto('auth.users')
      .values({
        email: email,
        email_verified: false,
      })
      .returning('auth.users.id')
      .executeTakeFirstOrThrow();

    await this.db
      .insertInto('auth.accounts')
      .values({
        user_id: newUser.id,
        provider: 'email',
        hash_password: hashPassword,
      })
      .execute();

    const { otp_expires_at } = await this.generateOtp(email, newUser.id);

    return { otp_expires_at, type: 'signup' };
  }
  private async generateOtp(email: string, userId: string) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashOtp = await bcrypt.hash(otp.toString(), 10);
    const expire_time = 10 * 60 * 1000;
    const otp_expires_at = new Date(Date.now() + expire_time);

    await this.db
      .insertInto('auth.userotps')
      .values({
        user_id: userId,
        otp: hashOtp,
        purpose: 'signup',
        expires_at: otp_expires_at,
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'purpose']).doUpdateSet({
          otp: (eb) => eb.ref('excluded.otp'),
          expires_at: (eb) => eb.ref('excluded.expires_at'),
          updated_at: new Date(),
        }),
      )
      .execute();

    await this.emailService.sendOtpEmail(email, otp, 'signup');

    return { otp_expires_at };
  }

  async validateOtp({ otp, purpose, email }: verifyOtpType) {
    const existingUser = await this.db
      .selectFrom('auth.users')
      .select(['id', 'email_verified'])
      .where('email', '=', email)
      .executeTakeFirst();

    if (!existingUser) {
      throwRpcError('User Does not exist', HttpStatus.NOT_FOUND);
    }
    if (existingUser.email_verified && purpose == 'signup') {
      throwRpcError('Email already verified', HttpStatus.CONFLICT);
    }
    const otpData = await this.db
      .selectFrom('auth.userotps')
      .selectAll()
      .where('user_id', '=', existingUser.id)
      .where('purpose', '=', purpose)
      .executeTakeFirst();

    if (!otpData) throwRpcError('User Does not exist', HttpStatus.NOT_FOUND);
    if (otpData.consumed_at != null)
      throwRpcError('otp already used generate new one', HttpStatus.CONFLICT);

    if (otpData.expires_at < new Date(Date.now()))
      throwRpcError('otp Expired', HttpStatus.UNAUTHORIZED);

    const match = await bcrypt.compare(otp, otpData.otp);
    if (match) {
      await this.db
        .updateTable('auth.users')
        .set({ email_verified: true })
        .where('id', '=', existingUser.id)
        .execute();

      const access_token = await this.generateAccessToken(
        existingUser.id,
        email,
      );
      const refresh_token = await this.generateRefreshToken(existingUser.id);
      return {
        success: true,
        access_token: access_token,
        refresh_token: refresh_token,
      };
    } else {
      throwRpcError('Otp does now match', HttpStatus.BAD_REQUEST);
    }
  }

  private async generateRefreshToken(id: string) {
    const refresh_token = uuidv4();
    const hashRefreshToken = crypto
      .createHash('sha256')
      .update(refresh_token)
      .digest('hex');
    const expire_time = 15 * 24 * 60 * 60 * 1000;
    const refresh_token_expires_at = new Date(Date.now() + expire_time);

    await this.db
      .insertInto('auth.sessions')
      .values({
        user_id: id,
        refresh_token: hashRefreshToken,
        expires_at: refresh_token_expires_at,
      })
      .execute();

    const sessions = await this.db
      .selectFrom('auth.sessions')
      .select(['id', 'created_at'])
      .where('user_id', '=', id)
      .orderBy('created_at', 'desc')
      .execute();
    if (sessions.length > 5) {
      const idsToDelete = sessions.slice(5).map((s) => s.id);
      await this.db
        .deleteFrom('auth.sessions')
        .where('id', 'in', idsToDelete)
        .execute();
    }

    return refresh_token;
  }
  private async generateAccessToken(id: string, email: string) {
    const payload = { sub: id, email: email };
    return await this.jwtService.signAsync(payload);
  }

  public async getAccessToken(token: string) {
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');

    const sessionData = await this.db
      .selectFrom('auth.sessions')
      .selectAll()
      .where('refresh_token', '=', hashToken)
      .executeTakeFirst();

    if (!sessionData) {
      throwRpcError('Token Incorrect', HttpStatus.BAD_REQUEST);
    }

    if (sessionData.expires_at < new Date(Date.now())) {
      throwRpcError(
        'Refresh token expired login again',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.db
      .selectFrom('auth.users')
      .select('email')
      .where('id', '=', sessionData.user_id)
      .executeTakeFirst();

    if (!user) {
      throwRpcError('User Does not exist', HttpStatus.NOT_FOUND);
    }

    const access_token = await this.generateAccessToken(
      sessionData.user_id,
      user.email,
    );
    return {
      refresh_token: access_token,
    };
  }
}
