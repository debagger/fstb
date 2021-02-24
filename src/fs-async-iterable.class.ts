/**
 * This is util class not inteded to use directly, It used for iterate try dirents.
 */
export class FSAsyncIterable<T> implements AsyncIterable<T> {
  constructor(private readonly iterable: AsyncGenerator<T>) {}

  [Symbol.asyncIterator]() {
    return this.iterable;
  }
  /**
   * Transform input items
   * @param callback - async function (must return Promise), which transform input item to output item
   */
  map<P>(callback: (item: T) => Promise<P>) {
    const iterable = this.iterable;
    const mapAsyncGenerator = async function*() {
      for await (const item of iterable) {
        yield await callback(item);
      }
    };
    return new FSAsyncIterable(mapAsyncGenerator());
  }

  /**
   * Pass items only when callback returns true.
   * @param callback - async function (must return Promise).
   */
  filter(callback: (item: T) => Promise<boolean>) {
    const iterable = this.iterable;
    const filterAsyncGenerator = async function*() {
      for await (const item of iterable) {
        if (await callback(item)) yield item;
      }
    };
    return new FSAsyncIterable(filterAsyncGenerator());
  }

  /**
   * The forEach() method executes a provided function once for each array element
   * @param callback - async function (must return Promise).
   */
  async forEach(callback: (item: T) => Promise<void>) {
    for await (const item of this.iterable) {
      await callback(item);
    }
  }
  /**
   *The toArray() method collect itertor items to array.
   */
  async toArray() {
    const result: T[] = [];
    for await (const item of this.iterable) {
      result.push(item);
    }
    return result;
  }
}
