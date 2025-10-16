/**
 * This script injects the version from the packages/appkit/package.json into the packages/appkit/exports/constants.ts file.
 * This is a alternative solution to not import the package.json file in our packages due to restriction on bundlers.
 * It's run before the build process of the packages starts with `prebuild` script.
 * See https://pnpm.io/it/next/cli/run#enable-pre-post-scripts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJsonPath = path.join(__dirname, '../packages/appkit/package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const envVersion = process.env.APP_VERSION && String(process.env.APP_VERSION).trim()
const versionToInject = envVersion && envVersion.length > 0 ? envVersion : packageJson.version

const filePath = 'packages/appkit/exports/constants.ts'

const fileContent = fs.readFileSync(filePath, 'utf8')
const updatedContent = fileContent.replace(
  /export const PACKAGE_VERSION = '.*'/,
  `export const PACKAGE_VERSION = '${versionToInject}'`
)
fs.writeFileSync(filePath, updatedContent, 'utf8')
console.log(`Injected version ${versionToInject} into ${filePath}`)

// Keep SDK runtime constant in sync as well so examples/logs show the right version
try {
  const sdkConstantsPath = path.join(__dirname, '../packages/sdk/src/constants.ts')
  if (fs.existsSync(sdkConstantsPath)) {
    const sdkSrc = fs.readFileSync(sdkConstantsPath, 'utf8')
    const replaced = sdkSrc.replace(
      /export\s+const\s+SDK_VERSION\s*=\s*'[^']*'/,
      `export const SDK_VERSION = '${versionToInject}'`
    )
    if (replaced !== sdkSrc) {
      fs.writeFileSync(sdkConstantsPath, replaced, 'utf8')
      console.log(`Injected SDK_VERSION ${versionToInject} into ${sdkConstantsPath}`)
    } else {
      console.log(`SDK_VERSION already set to ${versionToInject} in ${sdkConstantsPath}`)
    }
  }
} catch (err) {
  console.error('Failed to inject SDK_VERSION:', err instanceof Error ? err.message : err)
}
