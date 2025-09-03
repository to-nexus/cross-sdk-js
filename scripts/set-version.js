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
  path.join(repoRoot, 'packages', 'polyfills', 'package.json'),
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
  console.log('Usage: node scripts/set-version.js <version> [--include-reown] [--target-package=<package-name>]')
  console.log('Example: node scripts/set-version.js 1.16.6')
  console.log('Example: node scripts/set-version.js 1.7.0 --include-reown')
  console.log('Example: node scripts/set-version.js 1.7.0 --target-package=@reown/appkit-polyfills')
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

function updateSdkVersionConstant(filePath, newVersion) {
  if (!fs.existsSync(filePath)) return false
  const original = fs.readFileSync(filePath, 'utf8')
  const versionRegex = /export\s+const\s+sdkVersion\s*=\s*['\"]([^'\"]+)['\"]\s*;?/m
  const match = original.match(versionRegex)
  if (!match) return false
  const prev = match[1]
  if (prev === newVersion) return false
  const updated = original.replace(versionRegex, `export const sdkVersion = '${newVersion}';`)
  fs.writeFileSync(filePath, updated, 'utf8')
  return { prev, next: newVersion }
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
  const args = process.argv.slice(2)
  const versionArg = args.find(arg => !arg.startsWith('--'))
  const includeReown = args.includes('--include-reown')
  const targetPackageArg = args.find(arg => arg.startsWith('--target-package='))
  const targetPackage = targetPackageArg ? targetPackageArg.split('=')[1] : null
  
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
      // @reown/* 스코프 패키지 처리
      const pkgMeta = readJson(packageJsonPath)
      if (pkgMeta?.name && String(pkgMeta.name).startsWith('@reown/')) {
        if (targetPackage && pkgMeta.name === targetPackage) {
          // 특정 @reown 패키지만 타겟팅
          console.log(`Targeting specific @reown package: ${pkgMeta.name}`)
        } else if (!includeReown) {
          // 기본적으로 @reown 패키지 제외
          console.log(`Skipping @reown package: ${pkgMeta.name}@${pkgMeta.version}`)
          continue
        }
      }
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

  // 또한 SDK의 공개 상수 sdkVersion도 동기화합니다.
  try {
    const sdkExportsIndexPath = path.join(repoRoot, 'packages', 'sdk', 'exports', 'index.ts')
    const change = updateSdkVersionConstant(sdkExportsIndexPath, versionArg)
    if (change) {
      results.push({
        location: sdkExportsIndexPath,
        name: 'sdkVersion',
        prev: change.prev,
        next: change.next
      })
    }
  } catch (err) {
    console.error('Failed to update sdkVersion constant:', err instanceof Error ? err.message : err)
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
