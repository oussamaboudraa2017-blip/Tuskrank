/**
 * Domain primitives shared across modules. These are NOT database
 * models — they are platform-agnostic types used in TypeScript land.
 */

import type { Uuid } from './uuid.type';

export type Iso8601 = string & { readonly __brand: 'Iso8601' };
export type Iso4217 = string & { readonly __brand: 'Iso4217' };
export type HttpUrl = string & { readonly __brand: 'HttpUrl' };

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

export type { Uuid };
