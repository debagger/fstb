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
