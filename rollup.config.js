import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import dotenv from 'rollup-plugin-dotenv'
import AutoImport from 'unplugin-auto-import/rollup'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'

export default [
  {
    input: 'src/background/index.ts',
    output: {
      file: __dirname + '/extension/dist/background/index.global.js',
      format: 'iife',
    },
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        // include: ['src/background', 'src/utils', 'src/types.ts'],
      }),
      dotenv(),
      alias({ entries: [{ find: /~\//, replacement: __dirname + '/src/' }] }),
      commonjs(),
      AutoImport({
        imports: [
          {
            'webextension-polyfill': [['*', 'browser']],
          },
        ],
      }),
    ],
  },
  {
    input: 'src/contentScripts/index.ts',
    output: {
      file: __dirname + '/extension/dist/contentScripts/index.global.js',
      format: 'iife',
    },
    plugins: [
      nodeResolve({ browser: true }),
      typescript(),
      dotenv(),
      alias({ entries: [{ find: /~\//, replacement: __dirname + '/src/' }] }),
      commonjs(),
      AutoImport({
        imports: [
          {
            'webextension-polyfill': [['*', 'browser']],
          },
        ],
      }),
    ],
  },
]
