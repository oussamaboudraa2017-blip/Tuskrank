import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ description: 'Ingredient name.', example: 'Chicken Meal' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-safe slug.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'INCI (cosmetic ingredient) name.' })
  @IsString()
  @IsOptional()
  inciName?: string;

  @ApiPropertyOptional({ description: 'Ingredient category ID.' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Canonical (scientific) name.', example: 'Gallus gallus domesticus' })
  @IsString()
  @MinLength(1)
  canonicalName!: string;

  @ApiPropertyOptional({ description: 'Description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is animal-derived.', default: false })
  @IsBoolean()
  @IsOptional()
  isAnimalDerived?: boolean;

  @ApiPropertyOptional({ description: 'Is a common allergen.', default: false })
  @IsBoolean()
  @IsOptional()
  isCommonAllergen?: boolean;

  @ApiPropertyOptional({ description: 'Is controversial.', default: false })
  @IsBoolean()
  @IsOptional()
  isControversial?: boolean;

  @ApiPropertyOptional({ description: 'Is active.', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
