import { createReadStream } from 'fs';
import { createHash, BinaryToTextEncoding } from 'crypto';
/**
 *
 */
export class FSFileHash {
  constructor(public readonly path: string) {}
  /**
   *
   * @param algorithm
   * @param digestEnc
   */
  async hash(algorithm: string, digestEnc: BinaryToTextEncoding) {
    return new Promise<string>((reslove, reject) => {
      const hsum = createHash(algorithm);
      const stream = createReadStream(this.path);
      stream.on('data', chunk => hsum.update(chunk));
      stream.on('end', () => reslove(hsum.digest(digestEnc)));
      stream.on('error', err => reject(err));
    });
  }
  /**
   *
   * @param digestEnc
   */
  async md4(digestEnc?: BinaryToTextEncoding) {
    return await this.hash('md4', digestEnc ? digestEnc : 'hex');
  }
  /**
   *
   * @param digestEnc
   */
  async md5(digestEnc?: BinaryToTextEncoding) {
    return await this.hash('md5', digestEnc ? digestEnc : 'hex');
  }
  /**
   *
   * @param digestEnc
   */
  async sha1(digestEnc?: BinaryToTextEncoding) {
    return await this.hash('sha1', digestEnc ? digestEnc : 'hex');
  }
  /**
   *
   * @param digestEnc
   */
  async sha256(digestEnc?: BinaryToTextEncoding) {
    return await this.hash('sha256', digestEnc ? digestEnc : 'hex');
  }
  /**
   *
   * @param digestEnc
   */
  async sha512(digestEnc?: BinaryToTextEncoding) {
    return await this.hash('sha512', digestEnc ? digestEnc : 'hex');
  }
}
