import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DB_CONNECTION } from './database/database.module';
import { Kysely } from 'kysely';
import { Database } from '@repo/database';
import {
  loginSchemaType,
  resendOtpType,
  signupBodyType,
  verifyOtpType,
} from '@repo/validation-types';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { EmailService } from './email/email.service';
import { v4 as uuidv4 } from 'uuid';
import { throwRpcError } from './config/rpc-error.helper';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AppService {
  private googleClient: OAuth2Client;
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Kysely<Database>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async login(data: loginSchemaType) {
    const { email, password } = data;
    const existingUser = await this.db
      .selectFrom('auth.users')
      .select(['id', 'email', 'email_verified', 'first_name', 'last_name'])
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

    if (!user?.hash_password) {
      throwRpcError(
        'Email is registered through another login method',
        HttpStatus.CONFLICT, // This is the standard 409 error
      );
    }

    const passwordMatch = await bcrypt.compare(password, user?.hash_password);
    if (!passwordMatch) {
      throwRpcError('Incorrect Password', HttpStatus.UNAUTHORIZED);
    }

    const name =
      existingUser.first_name +
      (existingUser.last_name != null ? ' ' + existingUser.last_name : '');
    const access_token = await this.generateAccessToken(
      existingUser.id,
      email,
      name,
    );
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

  async resendOtp({ email, purpose }: resendOtpType) {
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

    const otpSendingTime = await this.db
      .selectFrom('auth.userotps')
      .select(['expires_at', 'updated_at'])
      .where('user_id', '=', existingUser.id)
      .executeTakeFirst();

    if (otpSendingTime) {
      const otpSentAt = new Date(otpSendingTime.updated_at).getTime();

      const diff = Date.now() - otpSentAt;

      console.log(diff, 5 * 60 * 1000);
      if (diff < 5 * 60 * 1000) {
        throwRpcError(
          'Please wait before trying another OTP',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
    return this.generateOtp(email, existingUser.id);
  }
  async validateOtp({ otp, purpose, email }: verifyOtpType) {
    const existingUser = await this.db
      .selectFrom('auth.users')
      .select(['id', 'email_verified', 'first_name', 'last_name'])
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
    const name =
      existingUser.first_name +
      (existingUser.last_name != null ? ' ' + existingUser.last_name : '');
    if (match) {
      await this.db
        .updateTable('auth.users')
        .set({ email_verified: true })
        .where('id', '=', existingUser.id)
        .execute();

      const access_token = await this.generateAccessToken(
        existingUser.id,
        email,
        name,
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
  private async generateAccessToken(id: string, email: string, name: string) {
    const payload = { id: id, email: email, name };
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
      .select(['email', 'first_name', 'last_name'])
      .where('id', '=', sessionData.user_id)
      .executeTakeFirst();

    if (!user) {
      throwRpcError('User Does not exist', HttpStatus.NOT_FOUND);
    }

    const name =
      user.first_name + (user.last_name != null ? ' ' + user.last_name : '');
    const access_token = await this.generateAccessToken(
      sessionData.user_id,
      user.email,
      name,
    );
    return {
      access_token: access_token,
    };
  }

  async verifyGoogleToken(
    token: string,
  ): Promise<import('google-auth-library').TokenPayload> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      console.log(payload);

      if (!payload) {
        throwRpcError('Invalid Google Token', HttpStatus.UNAUTHORIZED);
      }
      return payload; // Contains: email, name, picture, sub (Google ID)
    } catch (error) {
      console.log(error);
      throwRpcError('Google authentication failed', HttpStatus.UNAUTHORIZED);
    }
  }

  async googleLogin(token: string) {
    const googleUser = await this.verifyGoogleToken(token);
    console.log(' google user ', token);
    const existingUser = await this.db
      .selectFrom('auth.users')
      .select(['id', 'email_verified', 'first_name', 'last_name'])
      .where('email', '=', googleUser.email ?? '')
      .executeTakeFirst();
    console.log(existingUser);

    if (existingUser) {
      const data = await this.db
        .selectFrom('auth.accounts')
        .select('google_provider_id')
        .where('user_id', '=', existingUser.id)
        .executeTakeFirst();

      console.log(data);

      if (data && data.google_provider_id) {
        if (googleUser.sub !== data.google_provider_id) {
          throwRpcError('User Not found', HttpStatus.UNAUTHORIZED);
        }
      } else {
        await this.db
          .insertInto('auth.accounts')
          .values({
            user_id: existingUser.id,
            google_provider_id: googleUser.sub,
          })
          .execute();
      }
      const name =
        existingUser.first_name +
        (existingUser.last_name !== null ? ' ' + existingUser.last_name : '');
      const refresh_token = await this.generateRefreshToken(existingUser.id);
      const access_token = await this.generateAccessToken(
        existingUser.id,
        googleUser.email ?? '',
        name,
      );
      return {
        success: true,
        access_token: access_token,
        refresh_token: refresh_token,
      };
    } else {
      const { name, sub, email } = googleUser;
      console.log(googleUser);
      if (!email || !sub) {
        throwRpcError('User not found', HttpStatus.UNAUTHORIZED);
      }
      const first_name = name?.split(' ')[0] ?? 'Anonymous';
      const last_name = name?.split(' ')[1] ?? '';
      const fullName = first_name + (last_name ? ' ' + last_name : '');

      const { userId } = await this.db.transaction().execute(async (trx) => {
        const user = await trx
          .insertInto('auth.users')
          .values({
            email,
            email_verified: true,
            first_name,
            last_name,
          })
          .returning('auth.users.id')
          .executeTakeFirstOrThrow();

        await trx
          .insertInto('auth.accounts')
          .values({
            user_id: user.id,
            google_provider_id: sub,
          })
          .execute();

        return { userId: user.id };
      });

      const refresh_token = await this.generateRefreshToken(userId);
      const access_token = await this.generateAccessToken(
        userId,
        email,
        fullName,
      );
      return {
        success: true,
        access_token,
        refresh_token,
      };
    }
  }

  private async verifyGithubToken(token: string) {
    const [userRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'CompCoding',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'CompCoding',
        },
      }),
    ]);
    if (!userRes.ok || !emailRes.ok) {
      throwRpcError('GitHub authentication failed', HttpStatus.UNAUTHORIZED);
    }

    const user = await userRes.json();
    const emails: { email: string; primary: boolean; verified: boolean }[] =
      await emailRes.json();
    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email;
    if (!primaryEmail) {
      throwRpcError(
        'No verified primary email on GitHub account',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return { id: user.id, email: primaryEmail, name: user.name ?? user.login };
  }

  async githubLogin(githubAccessToken: string) {
    const githubUser = await this.verifyGithubToken(githubAccessToken);
    const existingUser = await this.db
      .selectFrom('auth.users')
      .select(['id', 'first_name', 'last_name'])
      .where('email', '=', githubUser.email)
      .executeTakeFirst();
    if (existingUser) {
      const account = await this.db
        .selectFrom('auth.accounts')
        .select('github_provider_id')
        .where('user_id', '=', existingUser.id)
        .executeTakeFirst();
      if (account?.github_provider_id) {
        if (account.github_provider_id !== String(githubUser.id)) {
          throwRpcError('Account conflict', HttpStatus.UNAUTHORIZED);
        }
      } else {
        // Link GitHub to existing account
        await this.db
          .updateTable('auth.accounts')
          .set({ github_provider_id: String(githubUser.id) })
          .where('user_id', '=', existingUser.id)
          .execute();
      }
      const name =
        existingUser.first_name +
        (existingUser.last_name !== null ? ' ' + existingUser.last_name : '');
      const refresh_token = await this.generateRefreshToken(existingUser.id);
      const access_token = await this.generateAccessToken(
        existingUser.id,
        githubUser.email,
        name,
      );
      return { success: true, access_token, refresh_token };
    }
    // New user — transaction
    const [first_name, last_name = ''] = githubUser.name.split(' ');
    const fullName = first_name + (last_name ? ' ' + last_name : '');
    const { userId } = await this.db.transaction().execute(async (trx) => {
      const user = await trx
        .insertInto('auth.users')
        .values({
          email: githubUser.email,
          email_verified: true,
          first_name,
          last_name,
        })
        .returning('auth.users.id')
        .executeTakeFirstOrThrow();
      await trx
        .insertInto('auth.accounts')
        .values({ user_id: user.id, github_provider_id: String(githubUser.id) })
        .execute();
      return { userId: user.id };
    });
    const refresh_token = await this.generateRefreshToken(userId);
    const access_token = await this.generateAccessToken(
      userId,
      githubUser.email,
      fullName,
    );
    return { success: true, access_token, refresh_token };
  }
}
