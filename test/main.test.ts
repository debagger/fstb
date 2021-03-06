import { FSPath, cwd, mkdtemp, envPath, range } from '../src';
import { join } from 'path';
import { stat, readdir, Dirent, Stats } from 'fs';
import { FSAsyncIterable } from '../src/fs-async-iterable.class';
import { EOL } from 'os';
import { createHash } from 'crypto';
import { FSDir } from '../src/fs-dir.class';
const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

const strSort = (a: string, b: string) => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

describe('FSPath', () => {
  it('Join path as prop name', () => {
    expect(FSPath('/aaa').bbb().path).toEqual(join('/aaa', '/bbb'));
  });

  it('Join path as key', () => {
    expect(FSPath('/aaa')['bbb.json']().path).toEqual(join('/aaa', 'bbb.json'));
  });

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
        await cwd.test
          .testfiles()
          .asDir()
          .files()
          .map(async dirent => dirent.name)
          .toArray()
      ).sort(strSort)
    ).toMatchObject(dir);
  });

  it('map subdirs in dir', async () => {
    expect(
      (
        await cwd.test
          .testfiles()
          .asDir()
          .subdirs()
          .map(async dirent => dirent.name)
          .toArray()
      ).sort(strSort)
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
      await cwd.test.testfiles['2.json']()
        .asFile()
        .stat()
    ).toMatchObject(_stat);
  });

  it('write and read json', async () => {
    const objectToWrite = {
      test: 'test',
      test1: 123,
    };
    const file1 = cwd.test.testfiles.dir1['file1.json']().asFile();

    await file1.write.json(objectToWrite);

    const readObject = await file1.read.json();

    expect(readObject).toMatchObject(objectToWrite);
  });

  it('async iterator maps', async () => {
    const gen = async function*() {
      for (let index = 0; index < 3; index++) {
        await sleep(100);
        yield index;
      }
    };
    const i = new FSAsyncIterable(gen());
    const j = i
      .map(async item => {
        await sleep(100);
        return item.toString();
      })
      .map(async item => {
        await sleep(100);
        return `# ${item}`;
      });
    const arr: string[] = [];

    for await (const item of j) {
      arr.push(item);
    }
    expect(arr).toMatchObject(['# 0', '# 1', '# 2']);
  });

  it('unlink file', async () => {
    const testfile = cwd.test.testfiles.dir2['filetodelete.txt']().asFile();
    await testfile.write.txt('It is test text file');
    expect(await testfile.isExists()).toBeTruthy();
    await testfile.unlink();
    expect(await testfile.isExists()).not.toBeTruthy();
  });

  it('mkdir and rmdir', async () => {
    const testdir = cwd.test.testfiles.dir3().asDir();
    if (await testdir.isExists()) {
      await testdir.rmdir();
    }
    expect(await testdir.isExists()).not.toBeTruthy();

    await testdir.mkdir();

    expect(await testdir.isExists()).toBeTruthy();

    await testdir.rmdir();

    expect(await testdir.isExists()).not.toBeTruthy();
  });

  it('subdir', async () => {
    const dirnames = await cwd.test
      .testfiles()
      .asDir()
      .subdirs()
      .map(async dir => dir.name)
      .toArray();
    dirnames.sort(strSort);
    expect(dirnames).toMatchObject(['dir1', 'dir2']);
  });

  it('subdir recursive', async () => {
    const dirnames = await cwd.test
      .testfiles()
      .asDir()
      .subdirs(true)
      .map(async dir => dir.name)
      .toArray();
    dirnames.sort(strSort);
    expect(dirnames).toMatchObject(['dir1', 'dir2', 'subdir1', 'subsubdir']);
  });

  it('csv', async () => {
    const csvContent = await cwd.test.testfiles.dir2['test.csv']()
      .asFile()
      .read.csvWithHeader(';')
      .toArray();
    const expectContent = [
      { col1: 'row1col1', col2: 'row1col2', col3: 'row1col3' },
      { col1: 'row2col1', col2: 'row2col2', col3: 'row2col3' },
    ];
    expect(csvContent).toMatchObject(expectContent);
  });

  it('csv async', async () => {
    const csvContent = await cwd.test.testfiles.dir2['test.csv']()
      .asFile()
      .read.csvWithHeaderAsync(';')
      .toArray();
    const expectContent = [
      { col1: 'row1col1', col2: 'row1col2', col3: 'row1col3' },
      { col1: 'row2col1', col2: 'row2col2', col3: 'row2col3' },
    ];
    expect(csvContent).toMatchObject(expectContent);
  });

  it('creates WriteStream', async () => {
    const file = cwd.test.testfiles['test-write-stream.txt']().asFile();
    if (await file.isExists()) await file.unlink();
    const stream = file.write.createWriteStream({ encoding: 'utf8', autoClose: true });
    const expectedContent = 'Test content';
    stream.write(expectedContent);
    stream.end(async () => {
      const actualContent = await file.read.txt();
      expect(actualContent).toBe(expectedContent);
    });
  });

  it('Compute total directory size and rimraf work', async () => {
    const root = cwd.test.testfiles.dir1.totalsizetest;
    await root()
      .asDir()
      .rimraf();

    let leveldir = root;
    await leveldir()
      .asDir()
      .mkdir();

    let expectedSize = 0;
    for (let level = 1; level <= 5; level++) {
      leveldir = leveldir['level' + level];
      const dir = leveldir().asDir();
      await dir.mkdir();
      for (let filenum = 0; filenum < 5; filenum++) {
        const file = leveldir[`file${filenum}.txt`]().asFile();
        await file.write.txt(`Content of ${file.name} in ${dir.name}`);
        const fileSize = (await file.stat()).size;
        expectedSize += fileSize;
      }
    }
    const actualTotalSize = await root()
      .asDir()
      .totalSize();
    expect(actualTotalSize).toBe(expectedSize);
    await root()
      .asDir()
      .rimraf();
  });

  it('append file', async () => {
    const file = cwd.test.testfiles['append-test.txt']().asFile();
    if (await file.isExists()) {
      await file.unlink();
    }
    const content = [];
    for (let i = 1; i <= 10; i++) {
      content.push(`Test string ${i}`);
    }

    for (const line of content) {
      await file.write.appendFile(line + EOL);
    }
    const actual = await file.read.lineByLine().toArray();

    expect(actual).toStrictEqual(content);

    await file.unlink();
  });

  it('creates temp dir', async () => {
    const tmp_pref = await mkdtemp('fstb');
    expect(await tmp_pref.isExists()).toBeTruthy();
    await tmp_pref.rmdir();
    const tmp_nopref = await mkdtemp();
    expect(await tmp_nopref.isExists()).toBeTruthy();
    await tmp_nopref.rmdir();
  });

  it('Make FSPath from environment var', () => {
    expect(() => envPath('VAR_NO_EXIST')).toThrow();
    const fallback = '/root/test1/test2';
    expect(envPath('VAR_NO_EXIST', fallback)().path).toBe(fallback);
    const expectPath = '/root/test2/test1';
    process.env['VAR_EXIST'] = expectPath;
    expect(envPath('VAR_EXIST')().path).toBe(expectPath);
    expect(envPath('VAR_EXIST', fallback)().path).toBe(expectPath);
  });

  it('can use writestream as promise', async () => {
    const file = cwd.test.testfiles['test-promise-ws.txt']().asFile();
    if (await file.isExists()) await file.unlink();
    const stream = file.write.createWriteStream();
    setImmediate(() => {
      range(1, 10)
        .forEach(async i => {
          await sleep(100);
          stream.write(i.toString() + '\n');
        })
        .then(() => {
          stream.end();
        });
    });
    await stream;
    const expected = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const actual = await file.read.lineByLine().toArray();
    expect(actual).toEqual(expected);
    await file.unlink();
  });

  it('can use readstream as promise', async () => {
    const tempDir = await mkdtemp('FSTBTEST');
    const tempfile = tempDir.fspath['tempfile']().asFile();
    try {
      const ws = tempfile.write.createWriteStream();
      const hsum_write = createHash('md5');
      for (let index = 0; index < 100_000; index++) {
        const chunk = Math.floor(Math.random() * 10000000).toString();
        hsum_write.update(chunk);
        ws.write(chunk);
      }
      ws.end();
      await ws;
      const expected = hsum_write.digest('hex');

      const hsum_read = createHash('md5');
      const rs = tempfile.read.createReadStream();
      rs.on('data', chunk => hsum_read.update(chunk));
      await rs;

      const actual = hsum_read.digest('hex');
      expect(actual).toBe(expected);
    } catch (error) {
      throw error;
    } finally {
      await tempDir.rimraf();
    }
  });

  it('copy file to dir', async () => {
    const tempDir = await mkdtemp('FSTBTEST');
    try {
      const srcDir = await tempDir.fspath
        .srcdir()
        .asDir()
        .mkdir();

      const dstDir = await tempDir.fspath
        .dstdir()
        .asDir()
        .mkdir();

      const srcfile = srcDir.fspath['tempfile']().asFile();
      await srcfile.write.txt('File copy test');
      const expectedHash = await srcfile.hash.md5();
      const dstfile = await srcfile.copyTo(dstDir);
      expect(srcfile.name).toBe(dstfile.name);
      const actualHash = await dstfile.hash.md5();

      expect(expectedHash).toBe(actualHash);
    } catch (error) {
      throw error;
    } finally {
      await tempDir.rimraf();
    }
  });

  it('copy file to FSFile', async () => {
    const tempDir = await mkdtemp('FSTBTEST');
    try {
      const srcDir = await tempDir.fspath
        .srcdir()
        .asDir()
        .mkdir();

      const dstDir = await tempDir.fspath
        .dstdir()
        .asDir()
        .mkdir();

      const srcfile = srcDir.fspath['tempfile']().asFile();
      await srcfile.write.txt('File copy test');
      const expectedHash = await srcfile.hash.md5();
      const dstfilename = 'dstfile';
      const dstfile = dstDir.fspath[dstfilename]().asFile();
      await srcfile.copyTo(dstfile);
      expect(dstfile.name).toBe(dstfilename);
      const actualHash = await dstfile.hash.md5();

      expect(expectedHash).toBe(actualHash);
    } catch (error) {
      throw error;
    } finally {
      await tempDir.rimraf();
    }
  });

  it('copy dir', async () => {
    const srcDir = await mkdtemp('FSTBTEST');
    const srcRoot = await srcDir.fspath['root']()
      .asDir()
      .mkdir();

    let destRoot: FSDir;

    let parent = srcRoot;
    await range(1, 10).forEach(async dirindex => {
      parent = await parent.fspath['subdir' + dirindex]()
        .asDir()
        .mkdir();
      await range(1, 10).forEach(async fileindex => {
        const filename = 'file' + fileindex + '.txt';
        const file = parent.fspath[filename]().asFile();
        await file.write.txt(`This is content of file ${filename}`);
      });
    });

    const destDir = await mkdtemp('FSTBTEST');
    destRoot = await srcRoot.copyTo(destDir);

    await srcRoot.subdirs(true).forEach(async dir => {
      await dir.files().forEach(async file => {
        const srcContent = await file.read.txt();
        const dstPath = file.path.replace(srcRoot.path, destRoot.path);
        const dstContent = await FSPath(dstPath)()
          .asFile()
          .read.txt();
        expect(dstContent).toBe(srcContent);
      });
    });
  });
});
