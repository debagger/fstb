import { Dirent, readdir, rmdir, mkdir, access, constants } from 'fs';
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
  private async *recursiveDirsGen() {
    for await (const dir of this.subdirs()) {
      yield dir;
      yield* dir.subdirs(true);
    }
  }
  public subdirs(recursive: boolean = false): FSAsyncIterable<FSDir> {
    if (recursive) {
      return new FSAsyncIterable(this.recursiveDirsGen());
    } else {
      return this.dirents()
        .filter(async dirent => dirent.isDirectory())
        .map(async dirent => new FSDir(join(this.path, dirent.name)));
    }
  }

  public async rmdir() {
    return new Promise<void>((resolve, reject) => {
      rmdir(this.path, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  public async mkdir(recursive: boolean = false) {
    return new Promise<void>((resolve, reject) => {
      mkdir(this.path, { recursive }, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Checks is dir exits
   */
  public async isExists() {
    return new Promise<boolean>(resolve => {
      access(this.path, constants.F_OK, err => {
        if (err) return resolve(false);
        resolve(true);
      });
    });
  }
}
