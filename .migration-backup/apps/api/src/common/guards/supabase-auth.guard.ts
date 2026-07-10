import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PinoLogger } from 'nestjs-pino';
import { PUBLIC_KEY, type AuthenticatedUser } from '@common/decorators';
import { UnauthorizedError } from '@common/errors/api-error';
import { AppEnvironment, UserRole } from '@common/enums';
import type { Request } from 'express';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    private readonly client: SupabaseClient;
    private readonly bypassInDev: boolean;
    private readonly nodeEnv: string;
    private readonly verifiedCache = new Map<string, AuthenticatedUser>();

    constructor(
        private readonly reflector: Reflector,
        private readonly config: ConfigService,
        private readonly logger: PinoLogger,
    ) {
        const supabaseUrl = this.config.get<string>('SUPABASE_URL');
        const supabaseKey = this.config.get<string>('SUPABASE_ANON_KEY');
        this.nodeEnv = this.config.get<string>('NODE_ENV', 'development');
        this.bypassInDev = this.nodeEnv === AppEnvironment.Development;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                'SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables.',
            );
        }

        this.client = createClient(supabaseUrl, supabaseKey);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            if (this.bypassInDev) {
                this.logger.warn('Bypassing authentication in development mode');
                (request as any).user = {
                    id: 'dev-user',
                    email: 'dev@tuskrank.local',
                    role: UserRole.Admin,
                };
                return true;
            }
            throw new UnauthorizedError('No token provided');
        }

        try {
            const user = await this.verifyToken(token);
            (request as any).user = user;
            return true;
        } catch (error) {
            this.logger.error({ err: error, token }, 'Token verification failed');
            throw new UnauthorizedError('Invalid token');
        }
    }

    private extractTokenFromHeader(request: Request): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return null;
        }
        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : null;
    }

    private async verifyToken(token: string): Promise<AuthenticatedUser> {
        const cached = this.verifiedCache.get(token);
        if (cached) {
            return cached;
        }

        const { data, error } = await this.client.auth.getUser(token);

        if (error || !data.user) {
            throw new UnauthorizedError('Invalid token');
        }

        const user: AuthenticatedUser = {
            id: data.user.id,
            email: data.user.email || undefined,
            role: this.getUserRole(data.user),
            raw: data.user as unknown as Record<string, unknown>,
        };

        this.verifiedCache.set(token, user);
        return user;
    }

    private getUserRole(user: any): UserRole {
        const roleClaim = user.user_metadata?.role || user.app_metadata?.role;
        if (roleClaim === 'admin') {
            return UserRole.Admin;
        }
        if (roleClaim === 'moderator') {
            return UserRole.Authenticated;
        }
        return UserRole.Authenticated;
    }
}