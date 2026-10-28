const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const projectRequire = process.env.MEDIA_REMOTION_PACKAGE
  ? createRequire(path.resolve(process.env.MEDIA_REMOTION_PACKAGE)) : require;
const {Config} = projectRequire('@remotion/cli/config');
const browser = process.env.MEDIA_BROWSER_EXECUTABLE;
if (!browser || !fs.existsSync(browser)) {
  throw new Error('Set MEDIA_BROWSER_EXECUTABLE to an existing compatible browser before rendering');
}
Config.setBrowserExecutable(browser);
const modules = [process.env.MEDIA_REMOTION_PACKAGE &&
  path.join(path.dirname(process.env.MEDIA_REMOTION_PACKAGE), 'node_modules'),
  ...(process.env.MEDIA_EXTRA_MODULES || '').split(path.delimiter)].filter(Boolean);
Config.overrideWebpackConfig((config) => ({...config, resolve: {...config.resolve,
  modules: [...modules, ...(config.resolve?.modules || ['node_modules'])]}}));
