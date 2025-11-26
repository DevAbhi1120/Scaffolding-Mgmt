import { Response } from 'express';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: any);
    download(params: any, res: Response): Promise<void>;
}
