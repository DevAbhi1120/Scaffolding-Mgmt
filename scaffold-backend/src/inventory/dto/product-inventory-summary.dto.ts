// inventory/dto/product-inventory-summary.dto.ts
export class ProductInventorySummaryDto {
  productId: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  damaged: number;
  lost: number;
  stockBalance: number;
}
