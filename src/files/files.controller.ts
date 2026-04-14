import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Delete,
  Body,
  UseGuards,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('spaces')
  @UseInterceptors(FileInterceptor('image'))
  @RoleProtected(
    ValidRoles.client,
    ValidRoles.assessor,
    ValidRoles.admin,
    ValidRoles.manager,
  )
  @UseGuards(AuthGuard, RolesGuard)
  async create(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp|pdf)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5 MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadFile(file);
    return { url };
  }

  @Delete('delete')
  async delete(@Body('fileUrl') fileUrl: string) {
    await this.filesService.deleteFile(fileUrl);
    return {
      msg: 'Archivo borrado correctamente',
    };
  }

  @Post('download')
  async getDownloadUrl(@Body('fileUrl') fileUrl: string) {
    const url = await this.filesService.getDownloadUrl(fileUrl);
    return { url };
  }
}
