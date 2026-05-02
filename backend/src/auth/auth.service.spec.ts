import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const config = new ConfigService({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    BACKEND_URL: 'http://127.0.0.1:3000',
    FRONTEND_URL: 'http://127.0.0.1:4200',
  });

  const request = {
    cookies: {},
    protocol: 'http',
    get: jest.fn((header: string) =>
      header.toLowerCase() === 'host' ? 'localhost:3000' : undefined,
    ),
  } as unknown as Request;
  const response = { cookie: jest.fn() } as unknown as Response;

  it('creates a Google OAuth URL', async () => {
    const service = new AuthService(config);

    const result = await service.createGoogleSignInUrl(request, response);

    expect(result).toContain('https://example.supabase.co/auth/v1/authorize');
    expect(result).toContain('provider=google');
    expect(result).toContain(
      encodeURIComponent('http://localhost:3000/auth/callback'),
    );
  });

  it('redirects callback errors back to the frontend login page', async () => {
    const service = new AuthService(config);

    await expect(
      service.handleOAuthCallback(
        undefined,
        'Google denied access',
        request,
        response,
      ),
    ).resolves.toBe(
      'http://127.0.0.1:4200/login?error=Google%20denied%20access',
    );
  });
});
