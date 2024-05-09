import { build, context } from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';

const watching = process.argv.includes('watch'),
  buildOptions = {
    entryPoints: [
      'js/app.ts',
      'css/app.scss',
      'js/langs/javascript-browser/worker.js',
      'js/langs/php-wasm/worker.ts',
      'js/langs/python-wasmer/worker.ts',
      'js/langs/webperl-5.28.1/worker.js',
    ],
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: 'dist',
    plugins: [sassPlugin(), {
      name: 'on-end',
      setup(build) {
        build.onEnd((result) => {
          if (!watching) {
            return;
          }

          if (result.errors.length) {
            console.log('\x1b[31mError rebuilding:\x1b[0m');
            console.error(result.errors);

            return;
          }

          console.log('\x1b[32mRebuilt.\x1b[0m');
        });
      }
    }],
    entryNames: '[dir]/[name]',
  };

if (watching) {
  const builder = await context(buildOptions);

  await builder.watch();
}
else {
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
}