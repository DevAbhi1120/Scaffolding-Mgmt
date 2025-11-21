import { ReportsService } from './reports.service';
import { Response } from 'express';
export declare class ReportsController {
    private svc;
    constructor(svc: ReportsService);
    orders(query: any, res: Response): Promise<Response<any, Record<string, any>>>;
    inventory(query: any, res: Response): Promise<Response<any, Record<string, any>>>;
    customers(query: any, res: Response): Promise<Response<any, Record<string, any>>>;
    ledger(builderId: string, query: any, res: Response): Promise<Response<any, Record<string, any>>>;
    ordersPdf(query: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
