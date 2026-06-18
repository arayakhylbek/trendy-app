import { Polar } from '@polar-sh/sdk';

let _polar: Polar | undefined;

export function getPolar(): Polar {
  if (_polar) return _polar;
  _polar = new Polar({
    accessToken: process.env['POLAR_ACCESS_TOKEN']!,
    server: (process.env['POLAR_SERVER'] ?? 'sandbox') as 'sandbox' | 'production',
  });
  return _polar;
}
