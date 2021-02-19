![CI](https://github.com/debagger/fstb/workflows/CI/badge.svg)

# FSTB User Guide

FSTB stands for FileSystem ToolBox. This library aims to make it easier to interact with the file system in Node.js

## Install

For install FSTB:

```bash
npm install fstb --save
```
## Usage

### Iterate subdirs:

```js
import { FSPath } from '../src';
FSPath(process.cwd()).node_modules().asDir().mapDirs(dir=>console.log(dir.name))

```
### Read and write json
```js
    const objectToWrite = {
      test: 'test',
      test1: 123,
    };
    const file1 = cwd.test.testfiles.dir1['file1.json']().asFile();

    await file1.write.json(objectToWrite);

    const readObject = await file1.read.json();
```

### Get file stats
```js
const stat = await cwd.test.testfiles['2.json']().asFile().stat()
```

