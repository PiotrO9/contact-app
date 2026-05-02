import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

type GoogleSignInUrlResponse = {
  url: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async createGoogleSignInUrl(
    redirectTo?: string,
  ): Promise<GoogleSignInUrlResponse> {
    const supabaseUrl = this.getRequiredConfig('SUPABASE_URL');
    const supabaseKey = this.getRequiredConfig('SUPABASE_PUBLISHABLE_KEY');
    const resolvedRedirectTo = this.resolveRedirectTo(redirectTo);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: resolvedRedirectTo
        ? {
            redirectTo: resolvedRedirectTo,
          }
        : undefined,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.url) {
      throw new InternalServerErrorException(
        'Supabase did not return a Google OAuth URL',
      );
    }

    return { url: data.url };
  }

  private resolveRedirectTo(redirectTo?: string): string | undefined {
    const defaultRedirectTo = this.configService.get<string>(
      'SUPABASE_AUTH_REDIRECT_TO',
    );
    const resolvedRedirectTo = redirectTo ?? defaultRedirectTo;

    if (!resolvedRedirectTo) {
      return undefined;
    }

    const redirectUrl = this.parseUrl(resolvedRedirectTo, 'redirectTo');
    const allowedOrigins = this.getAllowedRedirectOrigins();

    if (
      allowedOrigins.length > 0 &&
      !allowedOrigins.includes(redirectUrl.origin)
    ) {
      throw new BadRequestException('redirectTo origin is not allowed');
    }

    return redirectUrl.toString();
  }

  private getAllowedRedirectOrigins(): string[] {
    const configuredOrigins = this.configService.get<string>(
      'SUPABASE_AUTH_ALLOWED_REDIRECT_ORIGINS',
    );
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const origins = [frontendUrl, ...(configuredOrigins?.split(',') ?? [])];

    return origins
      .filter((origin): origin is string => Boolean(origin?.trim()))
      .map((origin) => this.parseUrl(origin.trim(), 'allowed origin').origin);
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }

    return value;
  }

  private parseUrl(value: string, label: string): URL {
    try {
      return new URL(value);
    } catch {
      throw new BadRequestException(`${label} must be a valid absolute URL`);
    }
  }
}
