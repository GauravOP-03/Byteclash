import { Global, Inject, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from '@repo/database';
import { Pool } from 'pg';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('CONNECTION_STRING');

        if (!connectionString) {
          throw new Error(
            'Database connectionString is not defined in environment variables',
          );
        }

        return new Kysely<Database>({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString,
            }),
          }),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: Kysely<Database>) {}

  async onModuleInit() {
    try {
      await this.db.selectFrom('auth.users').select('id').limit(1).execute();
      this.logger.log(' Database connection established successfully');
    } catch (error) {
      this.logger.error(' Database connection failed', error);
      throw error;
    }
  }
}
