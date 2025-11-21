"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSwmsDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_swms_dto_1 = require("./create-swms.dto");
class UpdateSwmsDto extends (0, mapped_types_1.PartialType)(create_swms_dto_1.CreateSwmsDto) {
}
exports.UpdateSwmsDto = UpdateSwmsDto;
//# sourceMappingURL=update-swms.dto.js.map