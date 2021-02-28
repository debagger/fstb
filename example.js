const { cwd } = require('./dist/index');
const { once } = require('events');
const { resolve, join } = require('path');
const fs = require('fs');
const rl = require('readline');

(async function() {
  const modules = await cwd
    .node_modules()
    .asDir()
    .subdirs()
    .map(async dir => dir.fspath['package.json']().asFile())
    .filter(async package_json => await package_json.isReadable())
    .map(async package_json => ({
      dirSize: await package_json.fsdir.totalSize(),
      name: (await package_json.read.json()).name,

    }))
    .toArray();
  modules.sort((a, b) => a.dirSize - b.dirSize);
  console.table(modules);
})();

// cwd["README.md"]().asFile().read.lineByLine().forEach(line=>console.log(line));

//   const wstream = cwd['test.csv']()
//     .asFile()
//     .write.createWriteStream({ autoClose: true });
// console.log("Write...")
// console.time("write time")
//   wstream.write('index,field1,field2,field3,field4,field5\n');
//   for (let index = 0; index < 100_000_000; index++) {
//     const chunk = `${index},field1index${index},field2index${index},field3index${index},field4index${index},field5index${index}\n`;
//     if (!wstream.write(chunk)) {
//       // (B)
//       // Handle backpressure
//       await once(wstream, 'drain');
//     }
//   }
//   wstream.close();
//   console.timeEnd("write time")

// console.log("Read...")
// console.time("Read time")
// await cwd['test.csv']()
//     .asFile()
//     .read.csvWithHeader(',')
//     .filter(item => Number.parseInt(item.index) > 99_999_990)
//     .forEach(item => console.log(item));
//   console.timeEnd("Read time")
// })

// console.log('Reading...');
// console.time('Reading time');
// const csvpath = join(process.cwd(), 'test.csv');
// const stream = fs.createReadStream(csvpath, { autoClose: true });
// const readline = rl.createInterface({ input: stream, crlfDelay: Infinity });
// let firstline;
// readline.on('line', input => {
//   const splitted = input.split(',');
//   if (firstline) {
//     const obj = firstline.reduce((prev, cur, ix) => {
//       prev[cur] = splitted[ix];
//       return prev;
//     }, {});

//     if (Number.parseInt(obj.index) > 99_999_990) {
//       console.log(obj);
//     }
//   } else {
//     firstline = splitted;
//   }
// });
// readline.on('close', () => {
//   console.timeEnd('Reading time');
// });
//   console.log(
//     'Total size of node_modules is ' +
//       Math.floor(
//         (await cwd
//           .node_modules()
//           .asDir()
//           .totalSize()) /
//           1024 /
//           1024
//       ) +
//       ' MBytes'
//   );
// });
