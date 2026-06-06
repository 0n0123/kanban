import { build } from 'npm:rolldown';

const bundles = [
  {
    input: 'src-gui/index.ts',
    output: {
      file: 'assets/scripts/index.js',
      format: 'esm',
      minify: true,
    }
  },
  {
    input: 'src-gui/script.ts',
    output: {
      file: 'assets/scripts/script.js',
      format: 'esm',
      minify: true,
    }
  }
];

for (const bundle of bundles) {
  console.log(`Building ${bundle.input} -> ${bundle.output.file}`);
  await build(bundle);
}
