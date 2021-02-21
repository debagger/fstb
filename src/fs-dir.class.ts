import { Dirent, readdir } from 'fs';
import { basename, join } from 'path';
import { FSFile } from './fs-file.class';
import { FSAsyncIterable } from './asyncIterable.class';
import { FSPath } from '.';

const readDirPromise = (path: string) =>
  new Promise<Dirent[]>((resolve, reject) => {
    readdir(path, { withFileTypes: true }, (err, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });

async function* direntsGen(path: string) {
  const dirents = await readDirPromise(path);
  for (const dirent of dirents) {
    yield dirent;
  }
}

export class FSDir {
  constructor(public readonly path: string) {}

  public readonly name = basename(this.path);

  public readonly fspath = FSPath(this.path);

  public dirents() {
    return new FSAsyncIterable(direntsGen(this.path));
  }

  public files() {
    return this.dirents()
      .filter(async dirent => dirent.isFile())
      .map(async dirent => new FSFile(join(this.path, dirent.name)));
  }

  public subdirs() {
    return this.dirents()
      .filter(async dirent => dirent.isDirectory())
      .map(async dirent => new FSDir(join(this.path, dirent.name)));
  }
}
