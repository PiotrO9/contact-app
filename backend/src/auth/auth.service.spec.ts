import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const config = new ConfigService({
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    FRONTEND_URL: 'http://localhost:5173',
    SUPABASE_AUTH_REDIRECT_TO: 'http://localhost:5173/auth/callback',
  });

  it('creates a Google OAuth URL', async () => {
    const service = new AuthService(config);

    const result = await service.createGoogleSignInUrl();

    expect(result.url).toContain(
      'https://example.supabase.co/auth/v1/authorize',
    );
    expect(result.url).toContain('provider=google');
  });

  it('rejects redirect URLs outside the allowed frontend origin', async () => {
    const service = new AuthService(config);

    await expect(
      service.createGoogleSignInUrl('https://malicious.example/auth/callback'),
    ).rejects.toThrow('redirectTo origin is not allowed');
  });
});
