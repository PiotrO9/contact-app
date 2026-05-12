export type InitialsSource = {
  name?: string | null;
};

export function getInitials(source: InitialsSource): string {
  const initials = (source.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || '?';
}

export function hideBrokenAvatar(event: Event): void {
  const image = event.target as HTMLImageElement;

  image.classList.add('is-hidden');
  image.setAttribute('aria-hidden', 'true');
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
