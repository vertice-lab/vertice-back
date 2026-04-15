import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaClientService extends PrismaClient {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });
  }
}
