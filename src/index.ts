import { join, basename } from 'path';
import { FSDir } from './FSDIr';
import { FSFile } from './FSSile';

class FSDirent {
  constructor(public readonly path: string) {}
  public readonly name = basename(this.path);
  public asDir() {
    return new FSDir(this.path);
  }

  public asFile() {
    return new FSFile(this.path);
  }
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
