import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Brand ID.' })
  @IsUUID()
  brandId!: string;

  @ApiProperty({ description: 'Product name.', example: 'Chicken & Rice Recipe' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  @ApiProperty({ description: 'URL-safe slug, unique per brand.' })
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiPropertyOptional({ description: 'Product description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'UPC / barcode.' })
  @IsString()
  @IsOptional()
  upc?: string;

  @ApiPropertyOptional({ description: 'SKU.' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Package size in grams.' })
  @IsString()
  @IsOptional()
  packageSizeGrams?: number;

  @ApiPropertyOptional({ description: 'Package size label.', example: '5 lb' })
  @IsString()
  @IsOptional()
  packageSizeLabel?: string;

  @ApiPropertyOptional({ description: 'Food form ID.' })
  @IsUUID()
  @IsOptional()
  foodFormId?: string;

  @ApiPropertyOptional({ description: 'Primary protein source ID.' })
  @IsUUID()
  @IsOptional()
  primaryProteinSourceId?: string;

  @ApiPropertyOptional({ description: 'Is active.', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Publish immediately after creation.', default: false })
  @IsBoolean()
  @IsOptional()
  publishImmediately?: boolean;
}
