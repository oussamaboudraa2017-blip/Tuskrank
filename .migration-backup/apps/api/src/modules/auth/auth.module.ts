import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { CommonModule } from '@common';

/**
 * Auth module — Sprint 2A scaffold.
 *
 *   * Supabase JWT verification (SupabaseAuthGuard)
 *   * `/me` route to validate wiring end-to-end
 *   * Public routes (login, refresh, logout) arrive Sprint 2B
 */
@Module({
  imports: [CommonModule],
  controllers: [AuthController],
})
export class AuthModule {}
