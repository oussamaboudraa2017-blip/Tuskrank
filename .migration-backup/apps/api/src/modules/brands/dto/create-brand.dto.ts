import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ description: 'Brand name.', example: 'Orijen' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-safe slug. Auto-generated from name if omitted.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name.', example: 'Champion Petfoods' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'ISO-3166 alpha-2 country code.', example: 'CA' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Official website URL.' })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Brand description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo image URL.' })
  @IsUrl()
  @IsOptional()
  logoImageUrl?: string;

  @ApiPropertyOptional({ description: 'Is active.', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
