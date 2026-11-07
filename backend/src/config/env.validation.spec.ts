import 'reflect-metadata';
import { validate } from './env.validation';
import configuration from './configuration';

describe('Environment Validation', () => {
  const validBaseEnv = {
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/commit_db',
    JWT_SECRET: 'test-fixture-dummy-jwt-secret-min16chars',
  };

  it('passes validation with required environment variables', () => {
    const validated = validate(validBaseEnv);
    expect(validated.DATABASE_URL).toBe(validBaseEnv.DATABASE_URL);
    expect(validated.JWT_SECRET).toBe(validBaseEnv.JWT_SECRET);
    expect(validated.PORT).toBe(3000);
  });

  it('throws an error if JWT_SECRET is missing', () => {
    const envWithoutSecret = {
      DATABASE_URL: validBaseEnv.DATABASE_URL,
    };

    expect(() => validate(envWithoutSecret)).toThrow(
      /JWT_SECRET is required and cannot be empty/,
    );
  });

  it('throws an error if JWT_SECRET is empty string', () => {
    const envWithEmptySecret = {
      DATABASE_URL: validBaseEnv.DATABASE_URL,
      JWT_SECRET: '',
    };

    expect(() => validate(envWithEmptySecret)).toThrow(
      /JWT_SECRET is required and cannot be empty/,
    );
  });

  it('throws an error if JWT_SECRET is shorter than 16 characters', () => {
    const envWithShortSecret = {
      DATABASE_URL: validBaseEnv.DATABASE_URL,
      JWT_SECRET: 'too-short',
    };

    expect(() => validate(envWithShortSecret)).toThrow(
      /JWT_SECRET must be at least 16 characters/,
    );
  });

  it('throws an error if DATABASE_URL is missing', () => {
    const envWithoutDb = {
      JWT_SECRET: validBaseEnv.JWT_SECRET,
    };

    expect(() => validate(envWithoutDb)).toThrow(
      /DATABASE_URL/,
    );
  });

  describe('Configuration JWT Fallback Remediation', () => {
    it('does not provide a hardcoded fallback for jwt.secret when process.env.JWT_SECRET is undefined', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      try {
        const config = configuration();
        expect(config.jwt.secret).toBeUndefined();
      } finally {
        if (originalSecret !== undefined) {
          process.env.JWT_SECRET = originalSecret;
        }
      }
    });

    it('returns the exact process.env.JWT_SECRET value when set', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'custom-environment-jwt-secret-12345';
      try {
        const config = configuration();
        expect(config.jwt.secret).toBe('custom-environment-jwt-secret-12345');
      } finally {
        if (originalSecret !== undefined) {
          process.env.JWT_SECRET = originalSecret;
        } else {
          delete process.env.JWT_SECRET;
        }
      }
    });
  });
});
