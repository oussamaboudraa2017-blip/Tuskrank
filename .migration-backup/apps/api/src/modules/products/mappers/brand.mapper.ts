import type { BrandEntity } from '../entities';
import { BrandSummaryDto } from '../dto';

/**
 * BrandEntity → BrandSummaryDto mapper.
 *
 * Pure function. No I/O. No logging.
 *
 * Sprint 2B wires this in after the brands repository hydrates
 * the Brand entity on the JOIN. The Sprint 2A skeleton ships
 * this so the public surface is well-defined.
 */
export function brandEntityToSummaryDto(brand: BrandEntity): BrandSummaryDto {
  const dto = new BrandSummaryDto();
  dto.id = brand.id;
  dto.name = brand.name;
  dto.slug = brand.slug;
  dto.countryCode = brand.countryCode ?? null;
  dto.logoImageUrl = brand.logoImageUrl ?? null;
  dto.isActive = brand.isActive;
  return dto;
}
