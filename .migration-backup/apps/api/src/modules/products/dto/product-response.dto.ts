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
  @ApiPropertyOptional() publishedAt?: Date | null;
  @ApiProperty() createdAt!: Date | string;
  @ApiProperty() updatedAt!: Date | string;
  @ApiPropertyOptional() deletedAt?: Date | null;
  @ApiPropertyOptional() overallScore?: number;
  @ApiPropertyOptional() grade?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDomain(domain: any): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = domain.id;
    dto.brandId = domain.brandId;
    dto.brandName = domain.brandName ?? domain.brand?.name ?? '';
    dto.name = domain.name;
    dto.slug = typeof domain.slug === 'object' ? (domain.slug as any).value : String(domain.slug);
    dto.description = domain.description ?? undefined;
    dto.upc = domain.upc ?? undefined;
    dto.sku = domain.sku ?? undefined;
    dto.packageSizeGrams = domain.packageSizeGrams != null ? Number(domain.packageSizeGrams) : undefined;
    dto.packageSizeLabel = domain.packageSizeLabel ?? undefined;
    dto.isActive = domain.isActive;
    dto.publishedAt = domain.publishedAt ? new Date(domain.publishedAt) : undefined;
    dto.createdAt = domain.createdAt instanceof Date ? domain.createdAt : new Date(domain.createdAt);
    dto.updatedAt = domain.updatedAt instanceof Date ? domain.updatedAt : new Date(domain.updatedAt);
    dto.deletedAt = domain.deletedAt ? (domain.deletedAt instanceof Date ? domain.deletedAt : new Date(domain.deletedAt)) : undefined;
    dto.overallScore = domain.overallScore;
    dto.grade = domain.grade;
    return dto;
  }
}