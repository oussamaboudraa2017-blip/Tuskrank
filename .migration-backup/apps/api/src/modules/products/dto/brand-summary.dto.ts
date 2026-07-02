import { ApiProperty } from '@nestjs/swagger';

/**
 * Wire shape of a brand as it appears in product responses.
 *
 * Mirrors the inline `brand` projection used in
 * `docs/API_ROADMAP.md` §3.
 *
 * No `created_at` etc. — only public product-page fields.
 */
export class BrandSummaryDto {
  @ApiProperty({
    description: 'Brand uuid.',
    example: '4f8d3c4c-67c7-4f56-9a8b-d1d6f6c2d6b5',
  })
  id!: string;

  @ApiProperty({ description: 'Display name.', example: 'Acme Pet Foods' })
  name!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'acme-pet-foods' })
  slug!: string;

  @ApiProperty({
    description: 'ISO-3166 alpha-2 country code. Null when unknown.',
    example: 'US',
    nullable: true,
  })
  countryCode!: string | null;

  @ApiProperty({
    description: 'Brand logo URL. Null when missing.',
    example: 'https://cdn.tuskrank.com/brands/acme.png',
    nullable: true,
  })
  logoImageUrl!: string | null;

  @ApiProperty({ description: 'Whether the brand is publicly listed.', example: true })
  isActive!: boolean;
}
