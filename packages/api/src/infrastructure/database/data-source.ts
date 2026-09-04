import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Used only by the TypeORM CLI (`npm run migration:run` / `migration:revert`
 * in packages/api). The running application uses DatabaseModule instead,
 * which reads config through Nest's ConfigService.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../modules/**/infrastructure/persistence/*.orm-entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});

export default AppDataSource;
