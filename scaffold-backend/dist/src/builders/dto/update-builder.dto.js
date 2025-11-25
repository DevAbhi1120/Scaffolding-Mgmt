"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBuilderDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_builder_dto_1 = require("./create-builder.dto");
class UpdateBuilderDto extends (0, mapped_types_1.PartialType)(create_builder_dto_1.CreateBuilderDto) {
}
exports.UpdateBuilderDto = UpdateBuilderDto;
//# sourceMappingURL=update-builder.dto.js.map