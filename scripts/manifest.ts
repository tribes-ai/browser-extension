import fs from 'fs-extra'
import { getManifest } from '../src/manifest'
import { r, log, isDev } from './utils'

export async function writeManifest() {
  const manifest = await getManifest()
  if (isDev) {
    manifest.permissions?.push('webNavigation')
  }
  await fs.writeJSON(r('extension/manifest.json'), manifest, {
    spaces: 2,
  })
  log('PRE', 'write manifest.json')
}

writeManifest()
