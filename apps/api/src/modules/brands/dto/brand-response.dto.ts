import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() manufacturer?: string;
  @ApiPropertyOptional() countryCode?: string;
  @ApiPropertyOptional() websiteUrl?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() logoImageUrl?: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date;
  @ApiPropertyOptional() productCount?: number;

  static fromDomain(domain: Record<string, unknown>): BrandResponseDto {
    const dto = new BrandResponseDto();
    dto.id = domain.id as string;
    dto.name = domain.name as string;
    dto.slug = domain.slug as string;
    dto.manufacturer = domain.manufacturer as string | undefined;
    dto.countryCode = domain.countryCode as string | undefined;
    dto.websiteUrl = domain.websiteUrl as string | undefined;
    dto.description = domain.description as string | undefined;
    dto.logoImageUrl = domain.logoImageUrl as string | undefined;
    dto.isActive = domain.isActive as boolean;
    dto.createdAt = domain.createdAt as Date;
    dto.updatedAt = domain.updatedAt as Date;
    dto.deletedAt = domain.deletedAt as Date | undefined;
    dto.productCount = domain.productCount as number | undefined;
    return dto;
  }
}
