import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngredientResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() inciName?: string;
  @ApiPropertyOptional() categoryId?: string;
  @ApiPropertyOptional() categoryName?: string;
  @ApiPropertyOptional() categorySlug?: string;
  @ApiProperty() canonicalName!: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() isAnimalDerived!: boolean;
  @ApiProperty() isCommonAllergen!: boolean;
  @ApiProperty() isControversial!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional() deletedAt?: Date;
  @ApiPropertyOptional() score?: number;
  @ApiPropertyOptional() grade?: string;
  @ApiProperty() productCount!: number;

  static fromDomain(domain: Record<string, unknown>): IngredientResponseDto {
    const dto = new IngredientResponseDto();
    dto.id = domain.id as string;
    dto.name = domain.name as string;
    dto.slug = domain.slug as string;
    dto.inciName = domain.inciName as string | undefined;
    dto.categoryId = domain.categoryId as string | undefined;
    dto.categoryName = domain.categoryName as string | undefined;
    dto.categorySlug = domain.categorySlug as string | undefined;
    dto.canonicalName = domain.canonicalName as string;
    dto.description = domain.description as string | undefined;
    dto.isAnimalDerived = domain.isAnimalDerived as boolean;
    dto.isCommonAllergen = domain.isCommonAllergen as boolean;
    dto.isControversial = domain.isControversial as boolean;
    dto.isActive = domain.isActive as boolean;
    dto.createdAt = domain.createdAt as Date;
    dto.updatedAt = domain.updatedAt as Date;
    dto.deletedAt = domain.deletedAt as Date | undefined;
    dto.score = domain.score as number | undefined;
    dto.grade = domain.grade as string | undefined;
    dto.productCount = (domain.productCount as number) ?? 0;
    return dto;
  }
}
