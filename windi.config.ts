import { resolve } from 'path'
import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        rubik: ['rubik'],
      },
      colors: {
        primary: '#2E5BFF',
        accent: '#505E75',
        'primary-light': '#F4F7FF',
        'brand-green': '#28C76F',
        'brand-red': '#EA5455',
        gray: {
          '100': '#E5E5E5',
          '300': '#CDD3E1',
        },
      },
    },
  },
  // https://windicss.org/posts/v30.html#attributify-mode
  attributify: true,
  extract: {
    include: [resolve(__dirname, 'src/**/*.{vue,html}')],
  },
})
