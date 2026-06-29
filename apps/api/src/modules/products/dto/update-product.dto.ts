import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for `PATCH /api/v1/products/:productId` (admin — update product).
 *
 * All fields are optional; only the supplied fields are patched.
 * At least one field must be present (enforced by the service).
 */
export class UpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name.', example: 'Acme Adult Chicken' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Marketing description.', example: 'Made with named animal protein...' })
  @IsString()
  @IsOptional()
  @MaxLength(8000)
  description?: string | null;

  @ApiPropertyOptional({ description: 'UPC / GTIN (8-14 digits).', example: '012345678901' })
  @IsString()
  @IsOptional()
  upc?: string | null;

  @ApiPropertyOptional({ description: 'Manufacturer SKU.', example: 'ACM-001' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  sku?: string | null;

  @ApiPropertyOptional({ description: 'Package size in grams.', example: 5000 })
  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  @IsOptional()
  packageSizeGrams?: number | null;

  @ApiPropertyOptional({ description: 'Human-readable package size label.', example: '5 lb' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  packageSizeLabel?: string | null;

  @ApiPropertyOptional({ description: 'Food form uuid.' })
  @IsUUID()
  @IsOptional()
  foodFormId?: string | null;

  @ApiPropertyOptional({ description: 'Primary protein source uuid.' })
  @IsUUID()
  @IsOptional()
  primaryProteinSourceId?: string | null;

  @ApiPropertyOptional({ description: 'Whether the product is publicly listed.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
