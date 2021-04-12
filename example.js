const fstb = require('./dist/index');
const fs = require('fs/promises');
const path = require('path');

(async function() {
  const file = fstb.cwd['million_of_randoms.txt']().asFile();

  //Пишем в файл
  const stream = file.write.createWriteStream({ encoding: 'utf8', autoClose: true });
  stream.on('open', () => {
    for (let index = 0; index < 1_000_000; index++) {
      stream.write(Math.random() + '\n');
    }
    stream.end();
  });
  await stream; // <= WTF!!!

  //Проверяем количество записей
  const lines = await file.read.lineByLine().reduce(acc => ++acc, 0);
  console.log(`${lines} lines writed`);

  // console.log(package_json);
  //   const node_modules = fstb.cwd.node_modules().asDir();

  //   const calcJSSize = async dir =>
  //     await dir
  //       .files()
  //       .filter(async file => file.name.toLowerCase().endsWith('.js'))
  //       .reduce(async (acc, file) => acc + (await file.stat()).size, 0);

  //   console.log('.js files size = ', await node_modules.subdirs(true).reduce(async (acc, dir) => acc + (await calcJSSize(dir)), 0));
})();
