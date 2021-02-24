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
   * Finish chain
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
    return new Promise<T[]>(resolve => {
      const arr: T[] = [];
      this.push = (item: T) => arr.push(item);
      this.end = () => resolve(arr);
    });
  }
}
