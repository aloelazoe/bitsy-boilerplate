import fse from 'fs-extra';
import path from 'path';
import getCss from './getCss';
import optimize from '@bitsy/optimizer';
import optimizeOptions from './input/optimization';
import resolve from 'resolve';
import externalDeps from './external-deps';
import bitsyPaths from './bitsy-paths.json';

const fontName = 'ascii_small';

async function build() {
  const externalDepsSrc = await Promise.all(Object.keys(externalDeps).map(async function (dep) {
    let p;
    try {
      p = resolve.sync(dep);
    } catch {
      try {
        p = resolve.sync(dep, {
          basedir: resolve.sync('@bitsy/hecks')
        });
      } catch {
        console.log(`couldn't find dependency '${dep}' in node modules\nyou might want to include it manually`);
      }
    }
    try {
      await fse.copy(p, path.join('./build/js', path.basename(p)));
      return `<script src="js/${path.basename(p)}"></script>`;
    } catch (err) {
      console.error(err);
    }
  }));

  const title = await fse.readFile('./input/title.txt');
  const gamedata = await fse.readFile('./input/gamedata.bitsy', 'utf8');
  const template = await fse.readFile(bitsyPaths.template[1], 'utf8');

  const fontData = await fse.readFile(bitsyPaths[fontName][1]);

  const css = await getCss('./input/style.css');
  const bitsyScripts = await Promise.all(
    Object.entries(bitsyPaths) // get all the bitsy files
    .filter(([key]) => key.startsWith('@@')) // filter out non-scripts
    .map(async ([key, [, path]]) => [key, await fse.readFile(path)]) // convert to map of promises resolving with [key, script]
  );

  const config = {
    '@@T': title,
    '@@D': Object.values(optimizeOptions).includes(true) ? optimize(gamedata, optimizeOptions) : gamedata,
    "@@C": css,
    '@@N': fontName,
    '@@M': fontData,

    ...bitsyScripts.reduce((r, [key, file]) => ({
      ...r,
      [key]: file,
    }), {}),

    '</head>': externalDepsSrc.join('\n') + '\n<script src="js/hacks.js"></script>\n</head>',
  };

  const html = Object.entries(config)
    .reduce(
      (result, [key, value]) => result.replace(key, value),
      template
    );

  await fse.outputFile('./build/index.html', html);
  if (fse.existsSync('./resources')) await fse.copy('./resources', './build');
}

build()
  .then(() => console.log('😸'))
  .catch(err => console.error('😿\n', err));
