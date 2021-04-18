const fstb = require('./dist/index');
const fs = require('fs/promises');
const path = require('path');

(async function() {
  // Создадим временную директорию
  const temp_dir = await fstb.mkdtemp("fstb-");
  if(await temp_dir.isExists()) console.log("Временный каталог создан")
  // В ней создадим три директории: src, target1 и target2
  const src = await temp_dir.fspath.src().asDir().mkdir();
  const target1 = await temp_dir.fspath.target1().asDir().mkdir();
  const target2 = await temp_dir.fspath.target2().asDir().mkdir();

  //В директории src создадим текстовый файл:
  const test_txt = src.fspath["test.txt"]().asFile();
  await test_txt.write.txt("Привет, хабр!");
  
  // Скопируем src в target1
  const src_copied = await src.copyTo(target1);
  // Переместим src в target2
  const src_movied = await src.moveTo(target2);

  // Выведем получившуюся структуру 
  await temp_dir.subdirs(true).forEach(async dir=>{
    await dir.files().forEach(async file=>console.log(file.path))
  })

  // Выведем содержимое файлов, они должны быть одинаковы 
  console.log(await src_copied.fspath["test.txt"]().asFile().read.txt())
  console.log(await src_movied.fspath["test.txt"]().asFile().read.txt())

  // Удалим веременную директорию со всем содержимым
  await temp_dir.rimraf()
  if(!(await temp_dir.isExists())) console.log("Временный каталог удален")
  //Создем объект FSDir для node_modules:
  const node_modules = fstb.cwd.node_modules().asDir();
  // получаем объект для работы с файлом "package.json" в подкаталоге "fstb"
  const package_json = node_modules.fspath.fstb["package.json"]().asFile()
  // Выводим в консоль все имена подкаталогов
  const ts_versions = await node_modules
    .subdirs()
    .map(async dir => ({
      dir,
      package_json: dir.fspath['package.json']().asFile(),
    }))
    //Проверяем наличие package.json в подкаталоге
    .filter(async ({ package_json }) => await package_json.isExists())
    // Читаем package.json
    .map(async ({ dir, package_json }) => ({
      dir,
      content: await package_json.read.json(),
    }))
    //Проверяем наличие devDependencies.typescript в package.json
    .filter(async ({ content }) => content.devDependencies?.typescript)
    // Отображаем имя директории и версию typescript
    .map(async ({ dir, content }) => ({
      name: dir.name,
      ts_version: content.devDependencies.typescript,
    }))
    .toArray();

  console.table(ts_versions);


  // const file = fstb.cwd['million_of_randoms.txt']().asFile();

  // //Пишем в файл
  // const stream = file.write.createWriteStream({ encoding: 'utf8', autoClose: true });
  // stream.on('open', () => {
  //   for (let index = 0; index < 1_000_000; index++) {
  //     stream.write(Math.random() + '\n');
  //   }
  //   stream.end();
  // });
  // await stream; // <= WTF!!!

  // //Проверяем количество записей
  // const lines = await file.read.lineByLine().reduce(acc => ++acc, 0);
  // console.log(`${lines} lines writed`);

  // const stat = await file.stat();

  // console.log(stat);

  // // Stats {
  // //   dev: 1243191443,
  // //   mode: 33206,
  // //   nlink: 1,
  // //   uid: 0,
  // //   gid: 0,
  // //   rdev: 0,
  // //   blksize: 4096,
  // //   ino: 26740122787869450,
  // //   size: 19269750,
  // //   blocks: 37640,
  // //   atimeMs: 1618579566188.5884,
  // //   mtimeMs: 1618579566033.8242,
  // //   ctimeMs: 1618579566033.8242,
  // //   birthtimeMs: 1618579561341.9297,
  // //   atime: 2021-04-16T13:26:06.189Z,
  // //   mtime: 2021-04-16T13:26:06.034Z,
  // //   ctime: 2021-04-16T13:26:06.034Z,
  // //   birthtime: 2021-04-16T13:26:01.342Z
  // // }

  // const fileHash = await file.hash.md5();

  // console.log('File md5 hash:', fileHash);
  // // File md5 hash: 5a0a221c0d24154b850635606e9a5da3

  // const renamedFile = await file.rename(`${fileHash}.txt`);

  // //Получаем путь к директории в которой находится наш файл и
  // // создаем в ней директорию "temp" если она не существует
  // const targetDir = renamedFile.fsdir.fspath.temp().asDir();
  // if (!(await targetDir.isExists())) await targetDir.mkdir();

  // //Копируем файл
  // const fileCopy = await renamedFile.copyTo(targetDir);

  // const fileCopyHash = await fileCopy.hash.md5();

  // console.log('File copy md5 hash:', fileCopyHash);
  // // File md5 hash: 5a0a221c0d24154b850635606e9a5da3

  // await renamedFile.unlink();
  // console.log({
  //   isExists: await file.isExists(),
  //   isReadable: await file.isReadable(),
  //   isWritable: await file.isWritable() });

  // console.log(package_json);
  //   const node_modules = fstb.cwd.node_modules().asDir();

  //   const calcJSSize = async dir =>
  //     await dir
  //       .files()
  //       .filter(async file => file.name.toLowerCase().endsWith('.js'))
  //       .reduce(async (acc, file) => acc + (await file.stat()).size, 0);

  //   console.log('.js files size = ', await node_modules.subdirs(true).reduce(async (acc, dir) => acc + (await calcJSSize(dir)), 0));
})();
