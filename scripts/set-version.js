/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

// 유지관리: 버전 변경 대상 package.json 경로 (커밋 리스트 기준)
const PACKAGE_JSON_PATHS = [
  path.join(repoRoot, 'package.json'),
  path.join(repoRoot, 'packages', 'adapters', 'bitcoin', 'package.json'),
  path.join(repoRoot, 'packages', 'adapters', 'ethers', 'package.json'),
  path.join(repoRoot, 'packages', 'adapters', 'polkadot', 'package.json'),
  path.join(repoRoot, 'packages', 'adapters', 'solana', 'package.json'),
  path.join(repoRoot, 'packages', 'adapters', 'wagmi', 'package.json'),
  path.join(repoRoot, 'packages', 'appkit-utils', 'package.json'),
  path.join(repoRoot, 'packages', 'appkit', 'package.json'),
  path.join(repoRoot, 'packages', 'cdn', 'package.json'),
  path.join(repoRoot, 'packages', 'common', 'package.json'),
  path.join(repoRoot, 'packages', 'core', 'package.json'),
  path.join(repoRoot, 'packages', 'experimental', 'package.json'),
  path.join(repoRoot, 'packages', 'scaffold-ui', 'package.json'),
  path.join(repoRoot, 'packages', 'sdk', 'package.json'),
  path.join(repoRoot, 'packages', 'siwe', 'package.json'),
  path.join(repoRoot, 'packages', 'siwx', 'package.json'),
  path.join(repoRoot, 'packages', 'ui', 'package.json'),
  path.join(repoRoot, 'packages', 'wallet-button', 'package.json'),
  path.join(repoRoot, 'packages', 'wallet', 'package.json')
]

function printUsageAndExit(message) {
  if (message) {
    console.error(message)
  }
  console.log('Usage: node scripts/set-version.js <version>')
  console.log('Example: node scripts/set-version.js 1.16.6')
  process.exit(message ? 1 : 0)
}

function isValidVersion(version) {
  // Basic semver x.y.z or x.y.z-prerelease
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)
}

function readJson(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(text)
}

function writeJson(filePath, data) {
  // Preserve trailing newline if present
  const original = fs.readFileSync(filePath, 'utf8')
  const hasTrailingNewline = original.endsWith('\n')
  const json = JSON.stringify(data, null, 2) + (hasTrailingNewline ? '\n' : '')
  fs.writeFileSync(filePath, json, 'utf8')
}

function setVersionForPackage(packageJsonPath, newVersion) {
  const pkg = readJson(packageJsonPath)
  if (!pkg || typeof pkg !== 'object') return false
  if (!pkg.version) return false
  const prev = pkg.version
  if (prev === newVersion) return false
  pkg.version = newVersion
  writeJson(packageJsonPath, pkg)
  return { name: pkg.name || path.basename(path.dirname(packageJsonPath)), prev, next: newVersion }
}

function main() {
  const [, , versionArg] = process.argv
  if (!versionArg) {
    printUsageAndExit('Error: version is required')
  }
  if (!isValidVersion(versionArg)) {
    printUsageAndExit(`Error: invalid version "${versionArg}"`)
  }

  const results = []

  for (const packageJsonPath of PACKAGE_JSON_PATHS) {
    if (!fs.existsSync(packageJsonPath)) continue
    try {
      const result = setVersionForPackage(packageJsonPath, versionArg)
      if (result) {
        results.push({ location: path.dirname(packageJsonPath), ...result })
      }
    } catch (err) {
      console.error(
        `Failed to update ${packageJsonPath}:`,
        err instanceof Error ? err.message : err
      )
    }
  }

  if (results.length === 0) {
    console.log('No versions changed.')
    return
  }

  console.log(`Updated version to ${versionArg} in ${results.length} packages:`)
  for (const r of results) {
    console.log(`- ${r.name || '(unknown)'}: ${r.prev} → ${r.next}`)
  }
}

main()
