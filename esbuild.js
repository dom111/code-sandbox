const { build } = require('esbuild'),
  { Prettier } = require('esbuild-plugin-prettier'),
  { sassPlugin } = require('esbuild-sass-plugin'),
  buildOptions = {
    entryPoints: [
      'js/app.ts',
      'css/app.scss',
      'js/langs/javascript-browser/worker.js',
      'js/langs/webperl-5.28.1/worker.js',
      'js/langs/python-wapm/worker.js',
    ],
    bundle: true,
    minify: true,
    sourcemap: true,
    watch: false,
    outdir: 'dist',
    plugins: [
        sassPlugin(),
        new Prettier(),
    ],
    entryNames: '[dir]/[name]',
  };

process.argv.forEach((arg) => {
  if (arg === 'watch') {
    buildOptions.watch = {
      onRebuild(error, result) {
        if (error) {
          console.log('\x1b[31mError rebuilding:\x1b[0m');
          console.error(error);

          return;
        }

        console.log('\x1b[32mRebuilt.\x1b[0m');
      },
    };
  }
});

process.stdout.write(`Building... `);

build(buildOptions)
  .then(() => {
    console.log('\x1b[32mdone.\x1b[0m');
  })
  .catch((e) => {
    console.log(`\x1b[31mfailed.\x1b[0m`);
    console.log('');
    console.error(e);

    process.exit(1);
  });
