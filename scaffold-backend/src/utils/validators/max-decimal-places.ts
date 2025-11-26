// src/utils/validators/max-decimal-places.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function MaxDecimalPlaces(decimals: number, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'maxDecimalPlaces',
      target: object.constructor,
      propertyName,
      constraints: [decimals],
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (value === null || value === undefined) return true;
          // Accept numeric input and string numbers (ValidationPipe should transform)
          const str = String(value);
          if (!str.includes('.')) return true;
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
