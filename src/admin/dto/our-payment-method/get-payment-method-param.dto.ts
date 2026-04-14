import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { normalizeString } from 'src/common/utils/normalize-string';

export class GetPaymentMethodParamDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return normalizeString(value) ?? value;
  })
  id: string;
}
