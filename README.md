# WebExtension Vite Starter

A [Vite](https://vitejs.dev/) powered WebExtension ([Chrome](https://developer.chrome.com/docs/extensions/reference/), [FireFox](https://addons.mozilla.org/en-US/developers/), etc.) starter template.

## Browser Extension

### Overview

This extension is used to track a user's tab activity, we only use metadata and don’t capture any personal information.

### Features

- Add or delete a domain
- Save tracked domains & tracking token in local storage
- Blocked domains cannot be enabled for tracking

### How does it work

There are 3 individual parts that are working together

- **Background Script**: This is the brains of the extension. All the tracking logic and code to send data to the server are - written in this file.
- **User Interface**: This part help users interact with the extension, users can add, block or enable domains to be tracked by the extension.
- **Content Script**: It helps the extension interact with pages opened or visited by the user.

More details here: [https://developer.chrome.com/docs/extensions/mv3/getstarted/extensions-101/](https://developer.chrome.com/docs/extensions/mv3/getstarted/extensions-101/)

### Onboarding

**Pre-requisite:** The user needs to be onboarded on the Tribes.ai platform

1. When a user first installs the extension, a new tab is opened and asks users to log in if they are not already logged in.
2. After login, the user is redirected to https://app.tribes.ai/settings#browser-extension
3. A token is generated on the platform and the token would be automatically picked by extension and stored in the memor(Without token data won’t be sent to the server)

![Browser extension workflow](/src/assets/Browser%20Extension%20Workflow.png)

### Technical Workflow

![Technical workflow](./src/assets/Technical%20Workflow.png)

## Features

- ⚡️ **Instant HMR** - use **Vite** on dev (no more refresh!)
- 🥝 Vue 3 - Composition API, [`<script setup>` syntax](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md) and more!
- 💬 Effortless communications - powered by [`webext-bridge`](https://github.com/antfu/webext-bridge) and [VueUse](https://github.com/antfu/vueuse) storage
- 🍃 [Windi CSS](https://windicss.org/) - on-demand CSS utilities
- 🦾 [TypeScript](https://www.typescriptlang.org/) - type safe
- 📦 [Components auto importing](./src/components)
- 🌟 [Icons](./src/components) - Access to icons from any iconset directly
- 🖥 Content Script - Use Vue even in content script
- 🌍 WebExtension - isomorphic extension for Chrome, Firefox, and others
- 📃 Dynamic `manifest.json` with full type support

## Pre-packed

### WebExtension Libraries

- [`webextension-polyfill`](https://github.com/mozilla/webextension-polyfill) - WebExtension browser API Polyfill with types
- [`webext-bridge`](https://github.com/antfu/webext-bridge) - effortlessly communication between contexts

### Vite Plugins

- [`unplugin-auto-import`](https://github.com/antfu/unplugin-auto-import) - Directly use `browser` and Vue Composition API without importing
- [`unplugin-vue-components`](https://github.com/antfu/vite-plugin-components) - components auto import
- [`unplugin-icons`](https://github.com/antfu/unplugin-icons) - icons as components
  - [Iconify](https://iconify.design) - use icons from any icon sets [🔍Icônes](https://icones.netlify.app/)
- [`vite-plugin-windicss`](https://github.com/antfu/vite-plugin-windicss) - WindiCSS support

### Vue Plugins

- [VueUse](https://github.com/antfu/vueuse) - collection of useful composition APIs

### UI Frameworks

- [Windi CSS](https://github.com/windicss/windicss) - next generation utility-first CSS framework

### Coding Style

- Use Composition API with [`<script setup>` SFC syntax](https://github.com/vuejs/rfcs/pull/227)
- [ESLint](https://eslint.org/) with [@antfu/eslint-config](https://github.com/antfu/eslint-config), single quotes, no semi

### Dev tools

- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.js.org/) - fast, disk space efficient package manager
- [esno](https://github.com/antfu/esno) - TypeScript / ESNext node runtime powered by esbuild
- [npm-run-all](https://github.com/mysticatea/npm-run-all) - Run multiple npm-scripts in parallel or sequential
- [web-ext](https://github.com/mozilla/web-ext) - Streamlined experience for developing web extensions

### Packages used

- [tldts](https://www.npmjs.com/package/tldts) - library to extract hostnames, domains, public suffixes, top-level domains and subdomains from URLs.
- [rollup](https://rollupjs.org/guide/en/) - for building and bundling background and content script.

## Usage

### Folders

- `src` - main source.
  - `contentScript` - scripts and components to be injected as `content_script`
  - `background` - scripts for background.
  - `components` - auto-imported Vue components that shared in popup and options page.
  - `styles` - styles shared in popup and options page
  - `manifest.ts` - manifest for the extension.
  - `utils` - Common function used across whole codebase.
- `extension` - extension package root.
  - `assets` - static assets.
  - `dist` - built files, also serve stub entry for Vite on development.
- `scripts` - development and bundling helper scripts.
- `rollup.config.js` - rollup config, helps in building and bundling of background and content script.

### Development

**Pre-requsite:**

- Node v16 LTS
- PNPM
- .env files

Clone repo if you haven't first and run (this step in required only once)

> If you don't have pnpm installed, run: npm install -g pnpm

```
pnpm i
```

To run development server

```bash
pnpm run:dev*
```

Then **load extension in browser with the `extension/` folder**.

For Firefox developers, you can run the following command instead:

```bash
pnpm start:firefox
```

`web-ext` auto reload the extension when `extension/` files changed.

### Development process

#### How to load unpacked extension

[https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/)

Due to manifest v3 changes HMR doesn't work anymore for UI and background script, whenever changes are done to background script you have to manually refresh the extension using reload button.

- `run-p dev:*`: this script will run all the commands starting with `dev` listed in package.json in parllel.
- `dev:prepare`: this will run prepare script inside `/scripts/prepare.ts`
- `dev:ui`: This command will take config from `vite.config.ts` and process the .vue files inside `src/popup`, convert them into js, bundle them and write to `extension/dist/popup` along with if any assets available into `extension/dist/assets`. Files will be watched by the bundler, any changes to .vue files will result in re-bundling of files.
- `dev:bg`: This command will take rollup.config.js, process `.ts` files inside `/src/background` and `/src/contentScripts`, convert them into js and bundle them,
  and write to `extensions/dist/background` & `extension/dist/contentScripts` respectively along with any assets available into `extension/dist/assets`. Files will be watched by the bundler, any changes to `src/background` or `src/contentScripts` files will result in re-bundling of files.

Also `.env.development` file will be used to inject .env values as NODE_ENV is set to development.

### Build

To build the extension, run

```bash
pnpm build:<env name>
e.g. pnpm build:sta (staging) or pnpm build:prod (production)
```

**Note:** Make sure that .env files are present and values are injected correctly into the code before uploading to any store.

And then pack files under `extension`, you can upload `extension.crx` or `extension.xpi` to appropriate extension store.

### Build process

There are three commands which run when we build the extension e.g.

```
npm run build:prepare && vite build --mode production && rollup -c --environment NODE_ENV:production
```

- npm run build:preapre

This command will create `manifest.json` file from `src/manifest.ts`

- vite build --mode production

This command will take config from `vite.config.ts` and process the .vue files inside `src/popup`, convert them into js, bundle them and write to `extension/dist/popup` along with if any assets available into `extension/dist/assets`

Also `.env.production` file will be used to inject .env values as the --mode is set to production

- rollup -c --environment NODE_ENV:production

This command will take rollup.config.js, process `.ts` files inside `/src/background` and `/src/contentScripts`, convert them into js and bundle them,
and write to `extensions/dist/background` & `extension/dist/contentScripts` respectively along with any assets available into `extension/dist/assets`

Also `.env.production` file will be used to inject .env values as NODE_ENV is set to production.

**IMPORTANT:** Always bump up the version is all the `.env` files and `package.json` before building and deploying extension to store.
