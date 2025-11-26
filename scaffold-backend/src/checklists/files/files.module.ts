import { Module, Global } from '@nestjs/common';
import { LocalFilesService } from './local-files.service';
import { S3FilesService } from './s3-files.service';

const useS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);

@Global()
@Module({
  providers: [
    {
      provide: 'FilesService',
      useClass: useS3 ? S3FilesService : LocalFilesService,
    },
  ],
  exports: ['FilesService'],
})
export class FilesModule {}
