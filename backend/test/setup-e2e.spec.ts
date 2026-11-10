import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadAndValidateE2eEnvironment,
  validateE2eDatabaseUrl,
} from './setup-e2e';

describe('Explicit E2E Environment File Loading & Isolation Hardening (setup-e2e)', () => {
  const tempFilesToClean: string[] = [];
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  function createTempEnvFile(content: string): string {
    const tempPath = path.join(
      os.tmpdir(),
      `commit-e2e-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.env`,
    );
    fs.writeFileSync(tempPath, content, 'utf8');
    tempFilesToClean.push(tempPath);
    return tempPath;
  }

  afterEach(() => {
    while (tempFilesToClean.length > 0) {
      const filePath = tempFilesToClean.pop();
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore cleanup errors on temp files
        }
      }
    }
  });

  afterAll(() => {
    // Restore original real test environment
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv;
    }
    try {
      loadAndValidateE2eEnvironment();
    } catch {
      // ignore
    }
  });

  describe('loadAndValidateE2eEnvironment - Explicit File Loading & Bypassing Prevention', () => {
    it('fails immediately when .env.test is missing even if shell has a valid inherited DATABASE_URL', () => {
      // Simulate parent shell environment containing a valid test DB URL
      process.env.DATABASE_URL =
        'postgresql://postgres:secret@localhost:5432/commit_test_db';

      const nonExistentPath = path.join(
        os.tmpdir(),
        'missing-commit-env-test-file.env',
      );

      expect(() => loadAndValidateE2eEnvironment(nonExistentPath)).toThrow(
        /Required test environment file.*does not exist.*Inherited shell environment variables are not permitted to bypass \.env\.test/,
      );
    });

    it('fails immediately when .env.test exists but contains no DATABASE_URL entry (inherited URL does not bypass)', () => {
      // Simulate parent shell environment containing a valid test DB URL
      process.env.DATABASE_URL =
        'postgresql://postgres:secret@localhost:5432/commit_test_db';

      // Temp file with other variables but NO DATABASE_URL
      const tempPath = createTempEnvFile('PORT=3001\nNODE_ENV=test\n');

      expect(() => loadAndValidateE2eEnvironment(tempPath)).toThrow(
        /DATABASE_URL is missing or empty in.*Test environment requires an explicit DATABASE_URL entry in \.env\.test/,
      );
    });

    it('fails immediately when DATABASE_URL is empty in .env.test', () => {
      const tempPath = createTempEnvFile('DATABASE_URL=""\nPORT=3001\n');

      expect(() => loadAndValidateE2eEnvironment(tempPath)).toThrow(
        /DATABASE_URL is missing or empty in/,
      );
    });

    it('fails immediately when DATABASE_URL is malformed in .env.test', () => {
      const tempPath = createTempEnvFile(
        'DATABASE_URL=not-a-valid-connection-string\n',
      );

      expect(() => loadAndValidateE2eEnvironment(tempPath)).toThrow(
        /Malformed DATABASE_URL connection string/,
      );
    });

    it('fails immediately when DATABASE_URL in .env.test targets development database commit_db', () => {
      const tempPath = createTempEnvFile(
        'DATABASE_URL="postgresql://postgres:secret@localhost:5432/commit_db"\n',
      );

      expect(() => loadAndValidateE2eEnvironment(tempPath)).toThrow(
        /Refusing to run E2E tests against development database "commit_db"/,
      );
    });

    it('fails immediately when DATABASE_URL in .env.test targets an unexpected database name', () => {
      const tempPathProd = createTempEnvFile(
        'DATABASE_URL="postgresql://postgres:secret@prod-host:5432/commit_prod"\n',
      );
      expect(() => loadAndValidateE2eEnvironment(tempPathProd)).toThrow(
        /Unexpected database "commit_prod".*must only target "commit_test_db"/,
      );

      const tempPathOther = createTempEnvFile(
        'DATABASE_URL="postgresql://postgres:secret@localhost:5432/random_db"\n',
      );
      expect(() => loadAndValidateE2eEnvironment(tempPathOther)).toThrow(
        /Unexpected database "random_db".*must only target "commit_test_db"/,
      );
    });

    it('successfully loads and sets process.env.DATABASE_URL when .env.test targets commit_test_db', () => {
      delete process.env.DATABASE_URL;

      const expectedUrl =
        'postgresql://valid_test_user:valid_test_pass@localhost:5432/commit_test_db';
      const tempPath = createTempEnvFile(
        `DATABASE_URL="${expectedUrl}"\nPORT=3001\nNODE_ENV=test\n`,
      );

      const result = loadAndValidateE2eEnvironment(tempPath);

      expect(result.databaseUrl).toBe(expectedUrl);
      expect(process.env.DATABASE_URL).toBe(expectedUrl);
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('validateE2eDatabaseUrl - Pure URL Format & Target Verification', () => {
    it('throws when DATABASE_URL is undefined or empty', () => {
      expect(() => validateE2eDatabaseUrl(undefined)).toThrow(
        /DATABASE_URL is missing or empty in test environment/,
      );
      expect(() => validateE2eDatabaseUrl('')).toThrow(
        /DATABASE_URL is missing or empty in test environment/,
      );
    });

    it('throws when protocol is not postgresql or postgres', () => {
      expect(() =>
        validateE2eDatabaseUrl(
          'mysql://user:pass@localhost:3306/commit_test_db',
        ),
      ).toThrow(/Invalid database protocol 'mysql:'/);
      expect(() =>
        validateE2eDatabaseUrl('http://localhost:5432/commit_test_db'),
      ).toThrow(/Invalid database protocol 'http:'/);
    });

    it('throws when no database name is specified', () => {
      expect(() =>
        validateE2eDatabaseUrl('postgresql://user:pass@localhost:5432/'),
      ).toThrow(/No database name specified in DATABASE_URL/);
    });

    it('accepts valid connection strings with query parameters', () => {
      const validWithQuery =
        'postgresql://user:pass@localhost:5432/commit_test_db?sslmode=disable&schema=public';
      expect(validateE2eDatabaseUrl(validWithQuery)).toBe(validWithQuery);
    });
  });
});
