"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
let FilesController = class FilesController {
    constructor(filesService) {
        this.filesService = filesService;
    }
    async download(params, res) {
        const key = decodeURIComponent(res.req.path.replace('/files/download/', ''));
        if (!key)
            throw new common_1.NotFoundException('File key missing');
        if (this.filesService.getDownloadUrl) {
            const url = await this.filesService.getDownloadUrl(key);
            return res.redirect(url);
        }
        if (this.filesService.streamFile) {
            const stream = await this.filesService.streamFile(key);
            stream.pipe(res);
            return;
        }
        throw new common_1.NotFoundException('File service does not support downloads');
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Get)('download/*'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "download", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    __param(0, (0, common_1.Inject)('FilesService')),
    __metadata("design:paramtypes", [Object])
], FilesController);
//# sourceMappingURL=files.controller.js.map