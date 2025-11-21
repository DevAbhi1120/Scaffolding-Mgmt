import { DataSource } from 'typeorm';
import { ReturnsService } from './returns.service';
export declare class ReturnsScheduler {
    private ds;
    private returnsService;
    private readonly logger;
    constructor(ds: DataSource, returnsService: ReturnsService);
    dailyLateReturnCheck(): Promise<void>;
}
