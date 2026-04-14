import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  PutObjectCommandInput,
  S3,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FilesService {
  private readonly bucketName = 'vertice';

  constructor(@Inject('S3_CLIENT') private readonly s3: S3) {}

  async uploadFile(
    file: Express.Multer.File,
    folderName: string = 'default',
  ): Promise<string> {
    await this.bucketExists();

    const fileExtension = file.originalname.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const folder = folderName;
    const keyValue = `${folder}/${uniqueFileName}`;

    const params = {
      Bucket: this.bucketName,
      Key: keyValue,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read' as const,
    };

    try {
      await this.s3.send(new PutObjectCommand(params as PutObjectCommandInput));

      return `https://${this.bucketName}.sfo3.digitaloceanspaces.com/${keyValue}`;
    } catch (error) {
      console.error('Error uploading file to Spaces:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) {
        throw new BadRequestException('fileUrl es requerido');
      }
      const url = new URL(fileUrl);

      const key = url.pathname.substring(1);

      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.send(
        new DeleteObjectCommand(params as DeleteObjectCommandInput),
      );

      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file from Spaces:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getDownloadUrl(fileUrl: string): Promise<string> {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: 'attachment',
      });

      // URL válida por 60 segundos
      return await getSignedUrl(this.s3, command, { expiresIn: 60 });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new InternalServerErrorException(
        'Error al generar el enlace de descarga',
      );
    }
  }

  private async bucketExists(): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName });
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchBucket') {
        throw new Error(`Bucket "${this.bucketName}" no existe.`);
      }
      throw error;
    }
  }
}
