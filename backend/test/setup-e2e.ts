import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Validates that the provided DATABASE_URL is safe and strictly targets 'commit_test_db'.
 * Fails immediately if missing, empty, malformed, or targeting any database other than 'commit_test_db'.
 * Never falls back to a default connection string.
 */
export function validateE2eDatabaseUrl(databaseUrl?: string): string {
  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error(
      'E2E Database Isolation Error: DATABASE_URL is missing or empty in test environment. ' +
        'Please ensure backend/.env.test exists and defines a valid DATABASE_URL.',
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error(
      'E2E Database Isolation Error: Malformed DATABASE_URL connection string.',
    );
  }

  if (
    parsedUrl.protocol !== 'postgresql:' &&
    parsedUrl.protocol !== 'postgres:'
  ) {
    throw new Error(
      `E2E Database Isolation Error: Invalid database protocol '${parsedUrl.protocol}'. Expected 'postgresql:' or 'postgres:'.`,
    );
  }

  // Extract database name from pathname (e.g., "/commit_test_db" -> "commit_test_db")
  const rawPath = parsedUrl.pathname.replace(/^\//, '').split('?')[0].trim();

  if (!rawPath) {
    throw new Error(
      'E2E Database Isolation Error: No database name specified in DATABASE_URL.',
    );
  }

  if (rawPath === 'commit_db') {
    throw new Error(
      'E2E Database Isolation Violation: Refusing to run E2E tests against development database "commit_db". ' +
        'E2E tests MUST run against an isolated test database "commit_test_db".',
    );
  }

  if (rawPath !== 'commit_test_db') {
    throw new Error(
      `E2E Database Isolation Violation: Unexpected database "${rawPath}". ` +
        'E2E tests are strictly isolated and must only target "commit_test_db".',
    );
  }

  return databaseUrl;
}

/**
 * Resolves, loads, and strictly validates the E2E test environment file.
 *
 * Requirements enforced:
 * 1. Checks file existence of the target environment file (defaults to backend/.env.test).
 * 2. Explicitly loads the file using dotenv.
 * 3. Checks dotenv result for loading errors.
 * 4. Fails immediately if the file does not exist or cannot be loaded.
 * 5. Obtains DATABASE_URL from parsed .env.test contents, NEVER from an inherited shell variable.
 * 6. Validates that the parsed DATABASE_URL is valid PostgreSQL and targets exactly commit_test_db.
 * 7. Only after successful validation assigns the validated URL to process.env.DATABASE_URL.
 */
export function loadAndValidateE2eEnvironment(envFilePath?: string): {
  envPath: string;
  databaseUrl: string;
} {
  const targetPath = envFilePath
    ? path.resolve(envFilePath)
    : path.resolve(__dirname, '../.env.test');

  if (!fs.existsSync(targetPath)) {
    throw new Error(
      `E2E Environment Configuration Error: Required test environment file "${targetPath}" does not exist. ` +
        'Inherited shell environment variables are not permitted to bypass .env.test.',
    );
  }

  const result = dotenv.config({ path: targetPath, override: true });

  if (result.error) {
    throw new Error(
      `E2E Environment Configuration Error: Failed to load test environment file "${targetPath}": ${result.error.message}`,
    );
  }

  // Strictly obtain DATABASE_URL from parsed file contents, not inherited process.env
  const parsedDatabaseUrl = result.parsed?.DATABASE_URL;

  if (!parsedDatabaseUrl || parsedDatabaseUrl.trim() === '') {
    throw new Error(
      `E2E Environment Configuration Error: DATABASE_URL is missing or empty in "${targetPath}". ` +
        'Test environment requires an explicit DATABASE_URL entry in .env.test.',
    );
  }

  const validatedUrl = validateE2eDatabaseUrl(parsedDatabaseUrl);

  // Only assign to process.env after strict validation
  process.env.DATABASE_URL = validatedUrl;
  process.env.NODE_ENV = 'test';

  return {
    envPath: targetPath,
    databaseUrl: validatedUrl,
  };
}

// Enforce explicit .env.test loading and strict isolation validation before any test framework or NestJS initialization
loadAndValidateE2eEnvironment();
