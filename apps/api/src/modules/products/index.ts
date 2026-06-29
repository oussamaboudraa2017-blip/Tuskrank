/**
 * Barrel exports for the Products module.
 *
 * The module itself is registered in `app.module.ts`; everything else
 * (`@common/*` services, repos, DTOs, mappers) is internal.
 */

export * from './products.module';
export * from './products.controller';
export * from './products.service';
