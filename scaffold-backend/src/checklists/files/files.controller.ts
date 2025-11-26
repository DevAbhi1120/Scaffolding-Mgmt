import { Controller, Get, Param, Inject, Res, NotFoundException, Header } from '@nestjs/common';
import { Response } from 'express';

@Controller('files')
export class FilesController {
    constructor(@Inject('FilesService') private readonly filesService: any) { }

    // stream or redirect to signed URL
    @Get('download/*')
    async download(@Param() params: any, @Res() res: Response) {
        // params[0] contains the wildcard path, Express style. But with Nest, use req.path parsing instead.
        const key = decodeURIComponent((res.req as any).path.replace('/files/download/', ''));
        if (!key) throw new NotFoundException('File key missing');

        if (this.filesService.getDownloadUrl) {
            // signed URL (S3) — redirect
            const url = await this.filesService.getDownloadUrl(key);
            return res.redirect(url);
        }

        if (this.filesService.streamFile) {
            const stream = await this.filesService.streamFile(key);
            stream.pipe(res);
            return;
        }

        throw new NotFoundException('File service does not support downloads');
    }
}
