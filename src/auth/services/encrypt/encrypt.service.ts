import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
} from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

@Injectable()
export class EncryptService {
  private readonly keyPass: string;
  private readonly algorithm = 'aes-256-ctr';
  private readonly salt: string;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    const salt = this.configService.get<string>('ENCRYPTION_SALT');

    if (!key || !salt) {
      throw new Error('Las variables de entorno de cifrado no están completas');
    }

    this.keyPass = key;
    this.salt = salt;
  }

  private async getKey(): Promise<Buffer> {
    return (await scryptAsync(this.keyPass, this.salt, 32)) as Buffer;
  }

  async encrypt(data: string): Promise<string> {
    const key = await this.getKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);

    const fullEncrypted = `${iv.toString('base64')}:${encrypted.toString(
      'base64',
    )}`;
    return fullEncrypted;
  }

  async decrypt(fullEncryptedData: string): Promise<string> {
    const key = await this.getKey();
    const parts = fullEncryptedData.split(':');

    if (parts.length !== 2) {
      throw new Error('Formato de datos encriptados inválido');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const encryptedText = Buffer.from(parts[1], 'base64');

    const decipher = createDecipheriv(this.algorithm, key, iv);

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
