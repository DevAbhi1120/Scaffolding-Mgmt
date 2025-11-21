import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { QueryChecklistDto } from './dto/query-checklist.dto';
export declare class ChecklistsController {
    private svc;
    constructor(svc: ChecklistsService);
    create(dto: CreateChecklistDto): Promise<import("./safety_checklist.entity").SafetyChecklist>;
    listByOrder(orderId: string): Promise<import("./safety_checklist.entity").SafetyChecklist[]>;
    get(id: string): Promise<import("./safety_checklist.entity").SafetyChecklist>;
    search(q: QueryChecklistDto): Promise<import("./safety_checklist.entity").SafetyChecklist[]>;
}
