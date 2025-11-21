import { DataSource } from 'typeorm';
export declare class ReportsService {
    private dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    lostDamagedSummary({ from, to }?: {
        from?: string;
        to?: string;
    }): Promise<any[]>;
    ordersReport(q: {
        page?: number;
        limit?: number;
        from?: string;
        to?: string;
        businessName?: string;
        businessAddress?: string;
        status?: 'OPEN' | 'CLOSED';
        format?: 'json' | 'csv';
    }): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
    }>;
    inventoryReport(q: {
        page?: number;
        limit?: number;
        productName?: string;
        categoryId?: string;
        builderId?: string;
        format?: 'json' | 'csv';
    }): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
    }>;
    customersReport(q: {
        page?: number;
        limit?: number;
        search?: string;
        format?: 'json' | 'csv';
    }): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
    }>;
    ledgerReport(builderId: string, q: {
        page?: number;
        limit?: number;
        format?: 'json' | 'csv';
    }): Promise<{
        items: any;
        total: number;
        page: number;
        limit: number;
        balance: number;
    }>;
    productInventoryControl({ productId, from, to, builderId }: {
        productId?: string;
        from: string;
        to: string;
        builderId?: string;
    }): Promise<{
        productId: any;
        productName: any;
        openingStock: number;
        stockIn: number;
        stockOut: number;
        damagedCount: number;
        damagedFees: number;
        lostCount: number;
        lostFees: number;
        balance: number;
    }[]>;
    private tableExists;
    private _productInventoryUsingMovements;
    private _productInventoryFallback;
    productInventoryControlCsv(params: {
        productId?: string;
        from: string;
        to: string;
        builderId?: string;
    }): Promise<string>;
    toCSV(columns: string[], rows: any[]): string;
    toSimpleHtmlReport(title: string, columns: string[], rows: any[]): string;
}
