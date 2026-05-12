import { HttpErrorResponse } from '@angular/common/http';

export function getHttpErrorMessage(
  error: unknown,
  fallbackMessage: string,
  options: { badRequestMessage?: string } = {},
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallbackMessage;
  }

  const responseMessage = error.error?.message;

  if (Array.isArray(responseMessage) && responseMessage.length > 0) {
    return responseMessage.join(' ');
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  if (error.status === 400 && options.badRequestMessage) {
    return options.badRequestMessage;
  }

  return fallbackMessage;
}
