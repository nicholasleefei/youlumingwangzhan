export function getRequiredEnv(name: string) {
  const value = (import.meta as unknown as { env: Record<string, string | undefined> }).env[name];
  // 如果环境变量缺失，返回空字符串而不是抛出异常
  if (!value) {
    return "";
  }
  return value;
}

