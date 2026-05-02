import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async signInWithGoogle(@Req() request: Request, @Res() response: Response) {
    const url = await this.authService.createGoogleSignInUrl(request, response);

    return response.redirect(url);
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const redirectUrl = await this.authService.handleOAuthCallback(
      code,
      errorDescription,
      request,
      response,
    );

    return response.redirect(redirectUrl);
  }

  @Get('me')
  async getCurrentUser(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.getCurrentUser(request, response);
  }

  @Post('logout')
  async signOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.signOut(request, response);
  }
}
