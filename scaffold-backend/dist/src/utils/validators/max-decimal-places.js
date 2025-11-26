"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxDecimalPlaces = MaxDecimalPlaces;
const class_validator_1 = require("class-validator");
function MaxDecimalPlaces(decimals, validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'maxDecimalPlaces',
            target: object.constructor,
            propertyName,
            constraints: [decimals],
            options: validationOptions,
            validator: {
                validate(value, _args) {
                    if (value === null || value === undefined)
                        return true;
                    const str = String(value);
                    if (!str.includes('.'))
                        return true;
                    const parts = str.split('.');
                    return parts[1].length <= decimals;
                },
                defaultMessage() {
                    return `Value can have at most ${decimals} decimal places`;
                },
            },
        });
    };
}
//# sourceMappingURL=max-decimal-places.js.map