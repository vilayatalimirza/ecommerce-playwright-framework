import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { UserData } from './DataFactory';

const AUTH_USER_FILE = path.resolve('playwright/.auth/credentials.json');

export async function loadAuthUser(): Promise<UserData> {
  const raw = await readFile(AUTH_USER_FILE, 'utf8');
  const parsed: unknown = JSON.parse(raw);

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('email' in parsed) ||
    !('password' in parsed) ||
    typeof parsed.email !== 'string' ||
    typeof parsed.password !== 'string'
  ) {
    throw new Error(
      'Generated authentication credentials are missing or invalid. Run the Playwright setup project first.',
    );
  }

  return parsed as UserData;
}
