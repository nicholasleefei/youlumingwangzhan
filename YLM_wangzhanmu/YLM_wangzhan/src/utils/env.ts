export function getRequiredEnv(name: string) {
  const value = (import.meta as unknown as { env: Record<string, string | undefined> }).env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

