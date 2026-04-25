import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaClientService extends PrismaClient {
  constructor() {
    const rawUrl = process.env.DATABASE_URL ?? '';
    const isSslRequired = rawUrl.includes('sslmode=require');

    // Quitar sslmode de la URL para que la librería pg no lo interprete
    // por su cuenta (en versiones recientes trata 'require' como 'verify-full'
    // y rechaza certificados auto-firmados como los de DigitalOcean).
    const cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]*/g, (match) =>
      match.startsWith('?') ? '?' : '',
    );
    // Limpiar posibles '?&' o '&&' residuales
    const connectionString = cleanUrl
      .replace('?&', '?')
      .replace(/&&/g, '&')
      .replace(/\?$/, '');

    const pool = new Pool({
      connectionString,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });
  }
}
