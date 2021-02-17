import { FSPath } from '../src';
import { join } from 'path';
import { stat, readdir } from 'fs/promises';

describe('FSPath', () => {
  it('Join path as prop name', () => {
    expect(FSPath('/aaa').bbb().path).toEqual(join('/aaa', '/bbb'));
  });

  it('Join path as key', () => {
    expect(FSPath('/aaa')['bbb.json']().path).toEqual(join('/aaa', 'bbb.json'));
  });

  const strSort = (a: string, b: string) => {
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
    return 0;
  };

  it('map files in dir', async () => {
    const dir = (await readdir(join(process.cwd(), '/test/testfiles'), { withFileTypes: true })).filter(d => d.isFile()).map(d => d.name);

    dir.sort(strSort);
    expect(
      (
        await FSPath(process.cwd())
          .test.testfiles()
          .asDir()
          .mapFiles(dirent => dirent.name)
      ).sort(strSort)
    ).toMatchObject(dir);
  });

  it('map subdirs in dir', async () => {
    expect(
      await FSPath(process.cwd())
        .test.testfiles()
        .asDir()
        .mapDirs(dirent => dirent.name)
    ).toMatchObject(['dir1', 'dir2']);
  });

  it('get file stat', async () => {
    const _stat = stat(join(process.cwd(), '/test/testfiles/2.json'));
    expect(
      await FSPath(process.cwd())
        .test.testfiles['2.json']()
        .asFile()
        .getStat()
    ).toMatchObject(_stat);
  });
});
