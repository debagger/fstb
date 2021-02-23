const { cwd } = require('./dist/index');
// cwd
//   .node_modules()
//   .asDir()
//   .subdirs(true)
//   .map(async dir => dir.fspath['package.json']().asFile())
//   .filter(async package_json => await package_json.isReadable())
//   .map(async package_json => await package_json.read.json())
//   .forEach(async content => console.log(`${content.name}@${content.version}`));

// cwd["README.md"]().asFile().read.lineByLine().forEach(line=>console.log(line));

cwd["test.csv"]().asFile().read.csvWithHeader(",").forEach(item=>{console.log(item)})