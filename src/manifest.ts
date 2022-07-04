import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { isDev, r, port } from '../scripts/utils'

export async function getManifest() {
  const pkg = (await fs.readJSON(r('package.json'))) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName,
    version: pkg.version,
    description: pkg.description,
    action: {
      default_icon: './assets/tribes-logo.png',
      default_popup: './dist/popup/index.html',
    },
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true,
    },
    background: {
      service_worker: './dist/background/index.global.js',
      type: 'module',
    },
    icons: {
      16: './assets/tribes-logo.png',
      48: './assets/tribes-logo.png',
      128: './assets/tribes-logo.png',
    },
    permissions: ['tabs', 'storage', 'activeTab', 'alarms'],
    host_permissions: [
      'https://events.dev.tribes.ai/',
      'https://events.sta.tribes.ai/',
      'https://events.tribes.ai/',
      'https://api.dev.tribes.ai/',
      'https://api.sta.tribes.ai/',
      'https://api.tribes.ai/',
    ],
    content_scripts: [
      {
        matches: ['http://*/*', 'https://*/*'],
        run_at: 'document_end',
        js: ['./dist/contentScripts/index.global.js'],
      },
    ],
    content_security_policy: {
      extension_pages: isDev
        ? // this is required on dev for Vite script to load
          `script-src 'self' http://localhost:${port}; object-src 'self' http://localhost:${port}`
        : "script-src 'self'; object-src 'self'",
    },
  }

  if (isDev) {
    // for content script, as browsers will cache them for each reload,
    // we use a background script to always inject the latest version
    // see src/background/contentScriptHMR.ts
    delete manifest.content_scripts
    manifest.permissions?.push('webNavigation')
  }

  return manifest
}
