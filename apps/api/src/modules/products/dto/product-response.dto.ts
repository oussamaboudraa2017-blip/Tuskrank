import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Accepts any object with product-like fields.
 * Both domain ProductEntity and DB ProductEntity satisfy this.
 */
interface ProductLike {
  readonly id: string;
  readonly brandId: string;
  readonly brand?: { name?: string } | null | undefined;
  readonly name: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly upc?: string | null;
  readonly sku?: string | null;
  readonly packageSizeGrams?: number | string | null;
  readonly packageSizeLabel?: string | null;
  readonly isActive: boolean;
  readonly publishedAt?: Date | string | null;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
  readonly deletedAt?: Date | string | null;
}

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

  static fromDomain(domain: ProductLike & { brandName?: string; overallScore?: number; grade?: string }): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = domain.id;
    dto.brandId = domain.brandId;
    dto.brandName = domain.brandName ?? domain.brand?.name ?? '';
    dto.name = domain.name;
    dto.slug = domain.slug;
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
    dto.overallScore = (domain as any).overallScore;
    dto.grade = (domain as any).grade;
    return dto;
  }
}