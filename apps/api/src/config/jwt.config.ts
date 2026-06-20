function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      console.error('FATAL: JWT_SECRET must be set to at least 32 random characters in production');
      process.exit(1);
    }
    return secret;
  }
  if (!secret) {
    console.warn('WARNING: JWT_SECRET not set — using insecure development fallback. Set JWT_SECRET before deploying to production.');
    return 'development-only-secret-change-me-32ch';
  }
  if (secret.length < 32) {
    console.warn('WARNING: JWT_SECRET is shorter than 32 characters. This is insecure in production.');
  }
  return secret;
}

export const JWT_SECRET = resolveJwtSecret();
