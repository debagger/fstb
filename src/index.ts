import { opendir, stat } from 'fs/promises';
// import { Dirent } from 'fs';
import { join, basename } from 'path';

class FSFile {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);

  public async getStat() {
    return await stat(this.path);
  }
}

class FSDir {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);
  public async mapDirs<T>(cb: (file: FSDir) => T | Promise<T>) {
    const dir = await opendir(this.path);
    const res = [] as T[];
    for await (const dirent of dir) {
      if (dirent.isDirectory()) {
        res.push(await cb(new FSDir(join(this.path, dirent.name))));
      }
    }
    return res;
  }

  public async mapFiles<T>(cb: (file: FSFile) => T | Promise<T>) {
    const dir = await opendir(this.path);
    const res = [] as T[];
    for await (const dirent of dir) {
      if (dirent.isFile()) {
        res.push(await cb(new FSFile(join(this.path, dirent.name))));
      }
    }
    return res;
  }
}

class FSDirent {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);
  public asDir() {
    return new FSDir(this.path);
  }

  public asFile() { return new FSFile(this.path)}
}

type FSPathType = {
  (): FSDirent;
  [key: string]: FSPathType;
};

export const FSPath = function(path: string): FSPathType {
  return new Proxy(() => new FSDirent(path), {
    get: (_, key: string) => FSPath(join(path, key)),
  }) as FSPathType;
};
