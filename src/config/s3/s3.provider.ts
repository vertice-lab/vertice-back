import { Provider } from '@nestjs/common';
import { S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export const S3Provider: Provider = {
  provide: 'S3_CLIENT',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new S3({
      forcePathStyle: false,
      endpoint: configService.get<string>('ENDPOINT_SPACES'),
      region: 'us-west-1',
      credentials: {
        accessKeyId:
          configService.get<string>('ACCESS_KEY_ID_DIGITAL_OCEAN') ?? '',
        secretAccessKey:
          configService.get<string>('SECRET_KEY_DIGITAL_OCEAN') ?? '',
      },
    });
  },
};
