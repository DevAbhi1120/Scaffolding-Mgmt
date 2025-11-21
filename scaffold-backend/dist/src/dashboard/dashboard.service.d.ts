import { DataSource } from 'typeorm';
export declare class DashboardService {
    private dataSource;
    constructor(dataSource: DataSource);
    totalClients(): Promise<number>;
    totalUsers(): Promise<number>;
    jobsSummary(): Promise<{
        total: number;
        ongoing: number;
        closed: number;
    }>;
    totalPaymentBalance(): Promise<number>;
    jobsList(start?: string, end?: string, page?: number, limit?: number): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
    }>;
    paymentsReceived(start?: string, end?: string, page?: number, limit?: number): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
        totalReceived: number;
    }>;
    fullSummary(): Promise<{
        totalClients: number;
        totalUsers: number;
        jobsSummary: {
            total: number;
            ongoing: number;
            closed: number;
        };
        totalPaymentBalance: number;
    }>;
}
