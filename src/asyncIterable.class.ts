export class FSAsyncIterable<T> implements AsyncIterable<T> {
  constructor(private readonly iterable: AsyncGenerator<T>) {}

  [Symbol.asyncIterator]() {
    return this.iterable;
  }

  map<P>(callback: (item: T) => Promise<P>) {
    const iterable = this.iterable;
    const gen = async function*() {
      for await (const item of iterable) {
        yield await callback(item);
      }
    };
    return new FSAsyncIterable(gen());
  }

  filter(callback: (item: T) => Promise<boolean>) {
    const iterable = this.iterable;
    const gen = async function*() {
      for await (const item of iterable) {
        if (await callback(item)) yield item;
      }
    };
    return new FSAsyncIterable(gen());
  }

  async forEach(callback: (item: T) => Promise<void>) {
    for await (const item of this.iterable) {
      await callback(item);
    }
  }

  async toArray() {
    const result: T[] = [];
    for await (const item of this.iterable) {
      result.push(item);
    }
    return result;
  }
}
