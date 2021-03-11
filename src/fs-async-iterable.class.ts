/**
 * This is util class not inteded to use directly, It used for iterate through dirents.
 */
export class FSAsyncIterable<T> implements AsyncIterable<T> {
  constructor(private readonly iterable: AsyncIterable<T>) {}

  [Symbol.asyncIterator]() {
    return this.iterable[Symbol.asyncIterator]();
  }

  /**
   * Transform input items
   * @param callback - async function (must return Promise),
   * which transform input item to output item
   * @param parallel - number of callbacks runs in parallel
   */
  map<P>(callback: (item: T) => Promise<P>, parallel: number = 1) {
    const iterable = this.iterable;
    const mapAsyncGenerator = async function*() {
      const pending = new Set<Promise<P>>();
      const finished = new Set<Promise<P>>();
      for await (const item of iterable) {
        const current = callback(item);
        pending.add(current);
        current
          .catch(() => {
            /* do nothing */
          })
          .finally(() => {
            pending.delete(current);
            finished.add(current);
          });
        if (pending.size >= parallel) await Promise.race(pending);

        for (const item of Array.from(finished)) {
          yield item;
          finished.delete(item);
        }
      }
      while (pending.size > 0) {
        await Promise.race(pending);
        for (const item of Array.from(finished)) {
          yield item;
          finished.delete(item);
        }
      }
      yield* finished;
    };
    return new FSAsyncIterable(mapAsyncGenerator());
  }

  /**
   * Pass items only when callback returns true.
   * @param callback - async function (must return Promise).
   * @param parallel - number of callbacks runs in parallel
   */
  filter(callback: (item: T) => Promise<boolean>, parallel: number = 1) {
    const iterable = this.iterable;
    const filterAsyncGenerator = async function*() {
      const pending = new Set<Promise<boolean>>();
      const finished = new Set<T>();
      for await (const item of iterable) {
        const current = callback(item);
        pending.add(current);
        current
          .then(res => {
            if (res) finished.add(item);
          })
          .catch(() => {
            /* do nothing */
          })
          .finally(() => {
            pending.delete(current);
          });
        if (pending.size >= parallel) await Promise.race(pending);

        for (const item of Array.from(finished)) {
          yield item;
          finished.delete(item);
        }
      }
      while (pending.size > 0) {
        await Promise.race(pending);
        for (const item of Array.from(finished)) {
          yield item;
          finished.delete(item);
        }
      }
      yield* finished;
    };
    return new FSAsyncIterable(filterAsyncGenerator());
  }

  /**
   * Calls the specified callback function for all the input elements.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   * @param callback A function that accepts up to four arguments.
   * The reduce method calls the callbackfn function one time for each element in the array.
   * Must return promise or be async.
   * @param initialValue initialValue is used as the initial value to start the accumulation.
   * The first call to the callbackfn function provides this value as an argument.
   */
  async reduce<U>(callback: (previousValue: U, currentValue: T) => Promise<U>, initialValue: U): Promise<U> {
    let previousValue = initialValue;
    for await (const item of this.iterable) {
      previousValue = await callback(previousValue, item);
    }
    return previousValue;
  }

  /**
   * The forEach() method executes a provided function once for each array element
   * @param callback - async function (must return Promise).
   * @param parallel - max items, that can be processed at same time. Optional parameter, equals 1 by default
   */
  async forEach(callback: (item: T) => Promise<void>, parallel: number = 1) {
    const activePromises = new Set();
    for await (const item of this.iterable) {
      const currentPromise = callback(item);
      activePromises.add(currentPromise);
      currentPromise
        .catch(_ => {
          /* do nothing */
        })
        .finally(() => {
          activePromises.delete(currentPromise);
        });

      if (activePromises.size >= parallel) await Promise.race(activePromises);
    }
    await Promise.all(activePromises);
  }
  /**
   *The toArray() method collect itertor items to array.
   */
  async toArray() {
    return await this.reduce(async (acc, item) => {
      acc.push(item);
      return acc;
    }, [] as T[]);
  }
}
