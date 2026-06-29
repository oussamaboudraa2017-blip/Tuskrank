import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
 * DTO for `POST /api/v1/products` (admin — create product).
 *
 * Validation uses `class-validator` for NestJS integration. Zod
 * schemas in `domain/validation/` are the domain-level equivalent;
 * the service may re-validate via Zod if stricter guarantees are
 * needed (e.g. slug format, UPC length).
 */
export class CreateProductDto {
  @ApiProperty({ description: 'Brand uuid.', example: '...' })
  @IsUUID()
  @IsNotEmpty()
  brandId!: string;

  @ApiProperty({ description: 'Product name.', example: 'Acme Adult Chicken' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'URL-safe slug (unique per brand).', example: 'acme-adult-chicken' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug!: string;

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

  @ApiPropertyOptional({ description: 'Whether the product is publicly listed.', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Publish immediately.', default: false })
  @IsBoolean()
  @IsOptional()
  publishImmediately?: boolean;
}
