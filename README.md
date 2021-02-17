# FSTB User Guide

FSTB stands for FileSystem ToolBox. This library aims to make it easier to interact with the file system in Node.js

## Install

For install FSTB:

```bash
npm install fstb --save
```
## Usage

```js
import { FSPath } from '../src';
FSPath(process.cwd()).node_modules().asDir().mapDirs(dir=>console.log(dir.name))

```


