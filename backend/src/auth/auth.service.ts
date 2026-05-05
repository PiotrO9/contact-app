import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { CookieOptions, Request, Response } from 'express';

type CookieMethods = NonNullable<
  Parameters<typeof createServerClient>[2]
>['cookies'];

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async createGoogleSignInUrl(
    request: Request,
    response: Response,
  ): Promise<string> {
    const supabase = this.createSupabaseServerClient(request, response);
    const backendUrl = this.getRequestOrigin(request);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${backendUrl}/auth/callback`,
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.url) {
      throw new InternalServerErrorException(
        'Supabase did not return a Google OAuth URL',
      );
    }

    return data.url;
  }

  async handleOAuthCallback(
    code: string | undefined,
    errorDescription: string | undefined,
    request: Request,
    response: Response,
  ): Promise<string> {
    const frontendUrl = this.getRequiredConfig('FRONTEND_URL');

    if (errorDescription) {
      return `${frontendUrl}/login?error=${encodeURIComponent(errorDescription)}`;
    }

    if (!code) {
      return `${frontendUrl}/login?error=${encodeURIComponent('Missing OAuth code')}`;
    }

    const supabase = this.createSupabaseServerClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return `${frontendUrl}/login?error=${encodeURIComponent(error.message)}`;
    }

    return frontendUrl;
  }

  async getCurrentUser(request: Request, response: Response) {
    const supabase = this.createSupabaseServerClient(request, response);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null };
    }

    const fullName =
      typeof user.user_metadata?.['full_name'] === 'string'
        ? user.user_metadata['full_name']
        : null;
    const avatarUrl =
      typeof user.user_metadata?.['avatar_url'] === 'string'
        ? user.user_metadata['avatar_url']
        : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: fullName ?? user.email,
        avatarUrl,
      },
    };
  }

  async signOut(request: Request, response: Response) {
    const supabase = this.createSupabaseServerClient(request, response);
    await supabase.auth.signOut();

    return { ok: true };
  }

  async getAuthenticatedUserId(
    request: Request,
    response: Response,
  ): Promise<string> {
    const bearerToken = this.extractBearerToken(request);

    if (bearerToken) {
      const supabase = this.createSupabaseAuthClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(bearerToken);

      if (error || !user) {
        throw new UnauthorizedException('Invalid Supabase access token');
      }

      return user.id;
    }

    const supabase = this.createSupabaseServerClient(request, response);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedException('Missing Supabase access token');
    }

    return user.id;
  }

  private createSupabaseServerClient(request: Request, response: Response) {
    return createServerClient(
      this.getRequiredConfig('SUPABASE_URL'),
      this.getSupabasePublicKey(),
      {
        cookies: this.createCookieMethods(request, response),
      },
    );
  }

  private createSupabaseAuthClient() {
    return createClient(
      this.getRequiredConfig('SUPABASE_URL'),
      this.getSupabasePublicKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  private extractBearerToken(request: Request): string | null {
    const authorization = request.get('authorization');

    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    return token;
  }

  private createCookieMethods(
    request: Request,
    response: Response,
  ): CookieMethods {
    return {
      getAll: () =>
        Object.entries(request.cookies ?? {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookie(name, value, this.toExpressCookieOptions(options));
        });
      },
    };
  }

  private toExpressCookieOptions(options: CookieOptions): CookieOptions {
    return {
      ...options,
      path: options.path ?? '/',
      sameSite: options.sameSite ?? 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
    };
  }

  private getRequestOrigin(request: Request): string {
    const protocol = request.get('x-forwarded-proto') ?? request.protocol;
    const host = request.get('host');

    if (host) {
      return `${protocol}://${host}`;
    }

    return this.getRequiredConfig('BACKEND_URL');
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }

    return value;
  }

  private getSupabasePublicKey(): string {
    const value =
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
      this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!value) {
      throw new InternalServerErrorException(
        'SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is not configured',
      );
    }

    return value;
  }
}
