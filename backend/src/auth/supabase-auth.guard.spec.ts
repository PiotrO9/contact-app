import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './authenticated-request';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  const createContext = (
    request: AuthenticatedRequest,
    response: Response,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    }) as ExecutionContext;

  it('stores the authenticated user id on the request', async () => {
    const request = {} as AuthenticatedRequest;
    const response = {} as Response;
    const authService = {
      getAuthenticatedUserId: jest.fn().mockResolvedValue('user-123'),
    } as unknown as AuthService;
    const guard = new SupabaseAuthGuard(authService);

    await expect(
      guard.canActivate(createContext(request, response)),
    ).resolves.toBe(true);

    expect(authService.getAuthenticatedUserId).toHaveBeenCalledWith(
      request,
      response,
    );
    expect(request.authenticatedUserId).toBe('user-123');
  });

  it('propagates authentication failures', async () => {
    const request = {} as AuthenticatedRequest;
    const response = {} as Response;
    const authService = {
      getAuthenticatedUserId: jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('Missing token')),
    } as unknown as AuthService;
    const guard = new SupabaseAuthGuard(authService);

    await expect(
      guard.canActivate(createContext(request, response)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
