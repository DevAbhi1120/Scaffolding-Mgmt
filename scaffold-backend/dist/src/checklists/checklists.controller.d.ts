import { ChecklistsService } from './checklists.service';
export declare class ChecklistsController {
    private readonly svc;
    private readonly filesService;
    constructor(svc: ChecklistsService, filesService: any);
    create(body: any, files?: Express.Multer.File[]): Promise<import("../database/entities/safety-checklist.entity").SafetyChecklist>;
    list(q: any): Promise<import("../database/entities/safety-checklist.entity").SafetyChecklist[]>;
    byOrder(orderId: string): Promise<import("../database/entities/safety-checklist.entity").SafetyChecklist[]>;
    getOne(id: string): Promise<import("../database/entities/safety-checklist.entity").SafetyChecklist>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
