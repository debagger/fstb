import { stat, readFile, writeFile } from 'fs';
import { basename } from 'path';

export class FSFile {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);
  public read = {
    txt: async () => {
      return new Promise<string>((resolve, reject) => {
        readFile(this.path, (err, data) => {
          if (err) return reject(err);
          resolve(data.toString());
        });
      });
    },
    json: async () => {
      return JSON.parse(await this.read.txt());
    },
  };

  public write = {
    txt: async (txt: string) => {
      return new Promise<void>((resolve, reject) => {
        writeFile(this.path, txt, err => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    json: async (obj: object) => {
      await this.write.txt(JSON.stringify(obj));
    },
  };

  public async stat() {
    return new Promise((resolve, reject) => {
      stat(this.path, (err, stat) => {
        if (err) return reject(err);
        resolve(stat);
      });
    });
  }
}
