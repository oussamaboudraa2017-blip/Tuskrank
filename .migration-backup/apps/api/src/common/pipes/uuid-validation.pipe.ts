import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { isUuid } from '@types';

/**
 * Parse a `:id` path parameter as a UUID. Rejects anything else
 * with a 400. Use together with `@Param('id', new UuidValidationPipe())`.
 */
@Injectable()
export class UuidValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUuid(value)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Path parameter is not a valid UUID',
        details: { value },
      });
    }
    return value;
  }
}
