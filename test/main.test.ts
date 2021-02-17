import { FSPath } from '../src';
import { join } from 'path';
import { stat, readdir, Dirent, Stats } from 'fs';

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
    const dirents = await new Promise<Dirent[]>((resolve, reject) => {
      const path = join(process.cwd(), '/test/testfiles');
      readdir(path, { withFileTypes: true }, (err, files) => {
        if (err) return reject(err);
        resolve(files);
      });
    });

    const dir = dirents.filter(d => d.isFile()).map(d => d.name);

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
    const path = join(process.cwd(), '/test/testfiles/2.json');

    const _stat = await new Promise<Stats>((resolve, reject) => {
      stat(path, (err, stat) => {
        if (err) return reject(err);
        resolve(stat);
      });
    });

    expect(
      await FSPath(process.cwd())
        .test.testfiles['2.json']()
        .asFile()
        .getStat()
    ).toMatchObject(_stat);
  });
});
