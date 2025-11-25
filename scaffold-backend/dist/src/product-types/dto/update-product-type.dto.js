"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_product_type_dto_1 = require("./create-product-type.dto");
class UpdateProductTypeDto extends (0, swagger_1.PartialType)(create_product_type_dto_1.CreateProductTypeDto) {
}
exports.UpdateProductTypeDto = UpdateProductTypeDto;
//# sourceMappingURL=update-product-type.dto.js.map