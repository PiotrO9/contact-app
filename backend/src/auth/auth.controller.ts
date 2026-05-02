import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async signInWithGoogle(@Query('redirectTo') redirectTo?: string) {
    return this.authService.createGoogleSignInUrl(redirectTo);
  }
}
