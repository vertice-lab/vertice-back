import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { S3Provider } from 'src/config/s3/s3.provider';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [FilesService, S3Provider],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
