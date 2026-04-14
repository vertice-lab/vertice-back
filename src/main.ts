import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('bootstrap');

  // app.enableCors({ origin: process.env.FRONTEND_URL });
  app.enableCors({ origin: '*' });
  app.use(helmet());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('REST API - Turisto Cash')
    .setDescription('Welcome to turisto cash')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, documentFactory);

  await app.listen(process.env.PORT ?? 5000, '0.0.0.0');
  logger.log(
    `App running on port: ===> ${process.env.PORT ?? 5000} (bound to 0.0.0.0)`,
  );
}
bootstrap();
