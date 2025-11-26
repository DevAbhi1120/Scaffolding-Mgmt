"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalTransformer = void 0;
exports.DecimalTransformer = {
    to: (value) => {
        if (value === null || value === undefined)
            return null;
        return value;
    },
    from: (value) => {
        if (value === null || value === undefined)
            return null;
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
    },
};
//# sourceMappingURL=decimal-transformer.js.map