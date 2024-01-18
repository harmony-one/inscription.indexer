import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

const config: DataSourceOptions = {
  type: 'postgres',
  url: `${process.env.DATABASE_URL}`,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: true,
  migrationsTableName: 'migrations',
  migrationsRun: false,
};

export default new DataSource(config);

export const typeormConfig = registerAs('typeorm', () => config);
