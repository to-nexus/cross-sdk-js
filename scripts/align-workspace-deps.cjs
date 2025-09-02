/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const PKG_DIRS = [path.join(ROOT, 'packages'), path.join(ROOT, 'providers')]
// 과거 패키지명 → 현재 워크스페이스 패키지명 매핑
const RENAME_MAP = {
  '@to-nexus/core': '@to-nexus/appkit-core',
  '@to-nexus/common': '@to-nexus/appkit-common',
  '@to-nexus/utils': '@to-nexus/appkit-utils'
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function listPackageJsons(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      results.push(...listPackageJsons(full))
    } else if (e.isFile() && e.name === 'package.json') {
      results.push(full)
    }
  }
  return results
}

function alignSection(section, workspaceNames, toExternalLatest) {
  if (!section) return false
  let changed = false
  for (const key of Object.keys(section)) {
    let depName = key
    // 리네이밍 매핑 처리
    if (RENAME_MAP[depName]) {
      const newName = RENAME_MAP[depName]
      const curVal = section[depName]
      if (section[newName] !== curVal) {
        section[newName] = curVal
        changed = true
      }
      delete section[depName]
      depName = newName
    }
    if (!depName.startsWith('@to-nexus/')) continue
    const isWorkspace = workspaceNames.has(depName)
    const cur = section[depName]
    if (isWorkspace) {
      if (cur !== 'workspace:*') {
        section[depName] = 'workspace:*'
        changed = true
      }
    } else {
      if (cur === 'workspace:*') {
        const latest = toExternalLatest(depName)
        if (latest) {
          section[depName] = `^${latest}`
          changed = true
        }
      }
    }
  }
  return changed
}

function run() {
  let total = 0
  // collect workspace package names
  const workspaceNames = new Set()
  for (const base of PKG_DIRS) {
    for (const file of listPackageJsons(base)) {
      try {
        const json = readJson(file)
        if (json.name) workspaceNames.add(json.name)
      } catch {}
    }
  }
  const cache = new Map()
  function toExternalLatest(depName) {
    if (cache.has(depName)) return cache.get(depName)
    try {
      const { execSync } = require('child_process')
      const v = execSync(`npm view ${depName} version`, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
      cache.set(depName, v)
      return v
    } catch {
      cache.set(depName, null)
      return null
    }
  }
  for (const base of PKG_DIRS) {
    for (const file of listPackageJsons(base)) {
      const json = readJson(file)
      let changed = false
      changed = alignSection(json.dependencies, workspaceNames, toExternalLatest) || changed
      changed = alignSection(json.devDependencies, workspaceNames, toExternalLatest) || changed
      changed = alignSection(json.peerDependencies, workspaceNames, toExternalLatest) || changed
      if (changed) {
        writeJson(file, json)
        console.log(`Aligned workspace deps in: ${path.relative(ROOT, file)}`)
        total += 1
      }
    }
  }
  console.log(`Done. Updated ${total} package.json files`)
}

if (require.main === module) run()


