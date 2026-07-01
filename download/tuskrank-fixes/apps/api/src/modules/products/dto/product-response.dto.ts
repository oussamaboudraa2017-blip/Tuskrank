import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProductEntity } from '../entities/product.entity';

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

  static fromDomain(domain: ProductEntity & { brandName?: string; overallScore?: number; grade?: string }): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = domain.id;
    dto.brandId = domain.brandId;
    dto.brandName = (domain as any).brandName ?? domain.brand?.name ?? '';
    dto.name = domain.name;
    dto.slug = domain.slug;
    dto.description = domain.description ?? undefined;
    dto.upc = domain.upc ?? undefined;
    dto.sku = domain.sku ?? undefined;
    dto.packageSizeGrams = domain.packageSizeGrams != null ? Number(domain.packageSizeGrams) : undefined;
    dto.packageSizeLabel = domain.packageSizeLabel ?? undefined;
    dto.isActive = domain.isActive;
    dto.publishedAt = domain.publishedAt ?? undefined;
    dto.createdAt = domain.createdAt;
    dto.updatedAt = domain.updatedAt;
    dto.deletedAt = domain.deletedAt ?? undefined;
    dto.overallScore = (domain as any).overallScore;
    dto.grade = (domain as any).grade;
    return dto;
  }
}