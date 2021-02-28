/**
 * This is util class not inteded to use directly, It used for iterate through dirents.
 */
export class FSIterable<T> {
  /**
   * Push next item to iterable chain.
   */
  public push: (item: T) => void = () => {
    throw new Error('Define operation first');
  };

  /**
   * Call when all items pushed
   */
  public end: () => void = () => {
    throw new Error('Define operation first');
  };

  /**
   * Transform input items
   * @param callback - function that peroform transform operation on input item
   */

  map<P>(callback: (item: T) => P) {
    const i = new FSIterable<P>();
    this.push = (item: T) => {
      if (i.push) {
        i.push(callback(item));
      }
    };
    this.end = () => i.end();
    return i;
  }

  /**
   * Pass items only when callback returns true.
   * @param callback - function that returns true if item must passed.
   */
  filter(callback: (item: T) => boolean) {
    const i = new FSIterable<T>();
    this.push = (item: T) => {
      if (i.push && callback(item)) {
        i.push(item);
      }
    };
    this.end = () => i.end();
    return i;
  }

  /**
   * Calls the specified callback function for all the input elements.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   * @param callback A function that accepts up to four arguments.
   * The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue initialValue is used as the initial value to start the accumulation.
   * The first call to the callbackfn function provides this value as an argument.
   */
  async reduce<U>(callback: (previousValue: U, currentValue: T) => U, initialValue: U): Promise<U> {
    let previousValue = initialValue;
    this.push = item => {
      previousValue = callback(previousValue, item);
    };
    return new Promise(resolve => {
      this.end = () => resolve(previousValue);
    });
  }

  /**
   * The forEach() method executes a provided function once for each array element
   * @param callback - function performs with each input item
   */
  async forEach(callback: (item: T) => void) {
    this.push = callback;
    return new Promise<void>(resolve => {
      this.end = resolve;
    });
  }
  /**
   *The toArray() method collect iterator items to array.
   */
  async toArray() {
    return await this.reduce((acc, item) => {
      acc.push(item);
      return acc;
    }, [] as T[]);
  }
}
