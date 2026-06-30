import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() brandId!: string;
  @ApiProperty() brandName!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() upc?: string;
  @ApiPropertyOptional() sku?: string;
  @ApiPropertyOptional() packageSizeGrams?: number;
  @ApiPropertyOptional() packageSizeLabel?: string;
  @ApiProperty() isActive!: boolean;
  @ApiPropertyOptional() publishedAt?: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date;
  @ApiPropertyOptional() overallScore?: number;
  @ApiPropertyOptional() grade?: string;

  static fromDomain(domain: Record<string, unknown>): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = domain.id as string;
    dto.brandId = domain.brandId as string;
    dto.brandName = domain.brandName as string;
    dto.name = domain.name as string;
    dto.slug = domain.slug as string;
    dto.description = domain.description as string | undefined;
    dto.upc = domain.upc as string | undefined;
    dto.sku = domain.sku as string | undefined;
    dto.packageSizeGrams = domain.packageSizeGrams as number | undefined;
    dto.packageSizeLabel = domain.packageSizeLabel as string | undefined;
    dto.isActive = domain.isActive as boolean;
    dto.publishedAt = domain.publishedAt as Date | undefined;
    dto.createdAt = domain.createdAt as Date;
    dto.updatedAt = domain.updatedAt as Date;
    dto.deletedAt = domain.deletedAt as Date | undefined;
    dto.overallScore = domain.overallScore as number | undefined;
    dto.grade = domain.grade as string | undefined;
    return dto;
  }
}
