![CI](https://github.com/debagger/fstb/workflows/CI/badge.svg)

# FSTB User Guide

FSTB stands for FileSystem ToolBox. This library aims to make it easier to interact with the file system in Node.js.
* [Documentation](https://debagger.github.io/fstb/)

## Install

For install FSTB:

```bash
npm install fstb --save
```

## Usage
### Work with pathes
Most basics way to use FSTB power start from create path to filesystem object using the FSPath function. 
It can be chained with any key name wich act as path segment.

Example:
```js
FSPath(__dirname).node_modules //work as path.join(__dirname, "node_modules")
FSPath(__dirname)["package.json"] //work as path.join(__dirname, "package.json")
FSPath(__dirname)["node_modules"]["fstb"]["package.json"]
```

### Special directories shortcuts
In many cases, you may need to work with special operating system directories. 
To do this, you can use a number of shortcuts that will make your code shorter and clearer.

* `cwd` is shortcut to `FSPath(process.cwd())`
* `dirname` is shortcut to `FSPath(__dirname)`
* `home` is shortcut to `FSPath(os.homedir())`
* `tmp` is shortcut to `FSPath(os.tmpdir())`

### Get path from environment variables
You often need to get different paths for the development, staging, and production environment. 
In such cases, it is common practice to store these paths in environment variables.
To support this use case, FSTB provides the `envPath` method.

```js
const { envPath } = require('fstb');
const { join } = require('path');

//Throws if no APP_DATA_DIR environment variable was found
const data_path = envPath("APP_DATA_DIR")

////If no APP_DATA_DIR environment variable was found, it fallback to assets/images in work directory
const images_path = envPath("APP_IMAGES_PATH", join(process.cwd(), "assets/images"))
```

### Make temporary directory

Sometimes you need to work with temporary files in your project.
Good practice for this case to do it in OS default temp dir.
`mkdtemp` method creates temporary subdir with random name in OS temp directory.

```js
const { mkdtemp } = require('fstb');
//creates temporary directory with 'fstb-' prefix
mkdtemp("fstb-").then(tempdir => {
 console.log(tempdir.path)
 //Output: C:\Users\user\AppData\Local\Temp\fstb-YBqC2b - for Windows
})
```

### Work with filesystem objects 

This is a tricky point to understand about the essence of FSPath. 
On the one hand, FSPath accepts a property or key with any name and returns a new FSPath, the closure of which contains the specified path. On the other hand, since it is a function, its call returns an object of type FSDirent. 
Thanks to this, we can construct a path by adding segment after segment, and when the path formation is complete, we just need to call the resulting function to continue working with all features of the FSTB library.

Example:
```js
const root = FSPath(__dirname); //Now root is function which closure __dirname path

//We can chain root path by any property or key
const node_modules_path = root.node_modules 
const package_json_path = root["package.json"]

//node_modules_path and package_json_path is function and we can call it.

const node_modules_dir =  node_modules_path().asDir() //now node_modules_dir is FSDir object for node_modules directory
const package_json_file = package_json_path().asFile() //and package_json_file is FSFile object for package.json file

//Before this point we didn't interact with filesystem. And now we do.

//iterate node_module subdirs and print names to console
node_modules_dir.subdirs().forEach(async subdir => console.log(subdir.name))

//print package.json content to console 
package_json_file.read.txt().then(content => console.log(content))
```

## Work with directories

All specific methods for interacts with directories contains in `FSDir` class.
Here is table of it:

Method name | Description
----------- | -----------
`dirents()` | Iterates thru all directory contents
`files()` | Iterates thru files in directory
`subdirs(recursive: boolean = false)` | Iterates thru subdirectories in directory. Can iterates all subdirectories tree by set to `true` optional parameter.
`rmdir()` | Removes directory if its empty
`mkdir(recursive: boolean = false)` | Creates directory. If `recursive` is true it can create all parent dirs wich not exists.
`isExists()` | Check if directory exist
`totalSize()` | Calculates the size of the entire directory content in bytes
`rimraf()` | Removes directory with all content
`copyTo(targetDir: FSDir)` | Copy directory with all content into target directory


Also `FSDir` has some useful fields:

Field name | Description
---------- | -----------
`path` | The full path for this directory
`name` | Name of this directory
`fspath` | FSPath function to construct child pathes from this directory

### Example: mkdtemp, copyTo, totalSize, rimraf usage
```js
const { cwd, mkdtemp } = require('fstb');

(async function() {
  // Create temp dir
  const tempdir = await mkdtemp('FSTB_Example_');
  // Get node_modules directory
  const node_modules = cwd.node_modules().asDir();

  console.log('Copy node_modules to temporary directory');
  const temp_node_modules = await node_modules.copyTo(tempdir);

  console.log('Calc node_modules size');
  console.log('node_modules size = ', await node_modules.totalSize());

  console.log('Calc temporary node_modules size');
  console.log('temporary node_modules size = ', await temp_node_modules.totalSize());

console.log('Remove temporary node_modules directory');
  await tempdir.rimraf();
})();

```
### Example: files, subdirs
```js
const { cwd } = require('./dist/index');

(async function() {
  const node_modules = cwd.node_modules().asDir();

  const calcJSSize = async dir =>
    await dir
      .files()
      .filter(async file => file.name.toLowerCase().endsWith('.js'))
      .reduce(async (acc, file) => acc + (await file.stat()).size, 0);

  console.log('.js files size = ', await node_modules.subdirs(true).reduce(async (acc, dir) => acc + (await calcJSSize(dir)), 0));
})();

```

## More examples

### Iterate subdirs:

```js
import { FSPath, cwd } from 'fstb';
cwd.node_modules().asDir().subdirs(async dir=>console.log(dir.name))

```
### Read and write json
```js
    const objectToWrite = {
      test: 'test',
      test1: 123,
    };
    //constructs path to file and get it as FSFile object
    const file1 = cwd.test.testfiles.dir1['file1.json']().asFile();

    //serialize object as json and save in to file1.json
    await file1.write.json(objectToWrite);

    //read json object from file1.json
    const readedObject = await file1.read.json();
```

### Get file stats

```js
const stat = await cwd.test.testfiles['2.json']().asFile().stat()
```

### Print all package names and versions from node_modules
It's complex example shows complex use case for FSTB. 
```js
const { cwd } = require('fstb');
cwd
  .node_modules()
  .asDir()
  .subdirs(true) //true for recursive scan all subfolders
  .map(async dir => dir.fspath['package.json']().asFile())
  .filter(async package_json => await package_json.isReadable())
  .map(async package_json => await package_json.read.json())
  .forEach(async content => console.log(`${content.name}@${content.version}`));
```
Results:
```txt
abab@2.0.5
acorn@6.4.2
acorn-globals@4.3.4
acorn-jsx@5.3.1
acorn-walk@8.0.2
...
yargs-parser@18.1.3
```
