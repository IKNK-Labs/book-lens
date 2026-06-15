type CookieOptions = {
  expires?: Date;
  maxAge?: number;
  [key: string]: unknown;
};

export function asSessionCookie<T extends CookieOptions>(options: T): T {
  if (options.maxAge === 0) {
    return options;
  }

  const sessionOptions = { ...options };
  delete sessionOptions.expires;
  delete sessionOptions.maxAge;

  return sessionOptions;
}
