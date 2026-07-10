import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '@common/guards';
import { CurrentUser } from '@common/decorators';
import { okResponse } from '@common/dto';
import { MeDto } from './dto/me.dto';
import type { AuthenticatedUser } from '@common/decorators';

/**
 * Auth scaffolding.
 *
 * Sprint 2A NOTE: Login / refresh / logout endpoints arrive in
 * Sprint 2B. For now we expose `GET /me` to verify the Supabase
 * auth wiring end-to-end.
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the currently authenticated user.' })
  async me(@CurrentUser() user: AuthenticatedUser | null) {
    const dto: MeDto = {
      id: user?.id ?? 'anonymous',
      email: user?.email ?? null,
      role: user?.role ?? 'anon',
    };
    return okResponse(dto);
  }
}
