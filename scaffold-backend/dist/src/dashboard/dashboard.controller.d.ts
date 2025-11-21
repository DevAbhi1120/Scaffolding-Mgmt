import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private svc;
    constructor(svc: DashboardService);
    summary(): Promise<{
        totalClients: number;
        totalUsers: number;
        jobsSummary: {
            total: number;
            ongoing: number;
            closed: number;
        };
        totalPaymentBalance: number;
    }>;
    jobs(start?: string, end?: string, page?: number, limit?: number): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
    }>;
    payments(start?: string, end?: string, page?: number, limit?: number): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
        totalReceived: number;
    }>;
}
