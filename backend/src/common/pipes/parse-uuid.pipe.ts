import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

@Injectable()
export class ParseUuidParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || !UUID_REGEX.test(value)) {
      throw new BadRequestException(
        `Validation failed: '${value}' is not a valid UUID format`,
      );
    }
    return value;
  }
}
