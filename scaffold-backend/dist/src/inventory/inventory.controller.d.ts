import { InventoryService } from './inventory.service';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createFromForm(dto: CreateInventoryFromFormDto, req: any): Promise<{
        success: boolean;
        data: import("./inventory.service").ProductInventorySummary;
    }>;
    getProductSummary(productId: string): Promise<{
        success: boolean;
        data: import("./inventory.service").ProductInventorySummary;
    }>;
}
