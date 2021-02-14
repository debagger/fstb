import {} from 'fs/promises';
import { join } from 'path';

function getDirent(path: string) {
  return { asDir: () => path, asFile: () => 'file' };
}

type FSPathType = { (): ReturnType<typeof getDirent>; [key: string]: FSPathType };

export const FSPath = function(path: string):FSPathType {
  return new Proxy(() => getDirent(path), {
    get: (_, key: string) => FSPath(join(path, key)),
  }) as FSPathType;
};

