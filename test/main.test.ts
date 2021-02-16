import { FSPath } from '../src';
import { join } from 'path';

describe('FSPath', () => {
  it('Join path as prop name', () => {
    expect(FSPath('/aaa').bbb().path).toEqual(join('/aaa', '/bbb'));
  });

  it('Join path as key', () => {
    expect(FSPath('/aaa')['bbb.json']().path).toEqual(join('/aaa', 'bbb.json'));
  });

  it('map files in dir', async () => {
    expect(
      await FSPath(process.cwd())
        .test.testfiles()
        .asDir()
        .mapFiles(dirent => dirent.name)
    ).toMatchObject(['1.txt', '2.json']);
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
    expect(
      (
        await FSPath(process.cwd())
          .test.testfiles['2.json']()
          .asFile()
          .getStat()
      ).size
    ).toEqual(36);
  });
});
