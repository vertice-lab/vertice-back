import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaClientService extends PrismaClient {
  constructor() {
    const isSslRequired = process.env.DATABASE_URL?.includes('sslmode=require');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });
  }
}
