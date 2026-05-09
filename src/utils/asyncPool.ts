export async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, Math.floor(poolLimit || 1));
  const ret: Promise<R>[] = [];
  const executing: Promise<any>[] = [];

  for (let i = 0; i < array.length; i++) {
    const item = array[i];

    const p = Promise.resolve().then(() => iteratorFn(item, i));
    ret.push(p);

    const e = p.finally(() => {
      const idx = executing.indexOf(e);
      if (idx >= 0) executing.splice(idx, 1);
    });
    executing.push(e);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(ret);
}
