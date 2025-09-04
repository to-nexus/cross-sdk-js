/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const TARGET_VERSION = process.argv[2]
if (!TARGET_VERSION) {
  console.error('Usage: node scripts/set-workspace-version.cjs <version>')
  process.exit(1)
}

const SEARCH_DIRS = [path.join(ROOT, 'packages'), path.join(ROOT, 'providers')]

function listPackageJsons(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.isFile() && e.name === 'package.json') out.push(full)
    }
  }
  walk(dir)
  return out
}

function updateFile(file) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (typeof json.version !== 'string') return false
  if (json.version === TARGET_VERSION) return false
  json.version = TARGET_VERSION
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
  return true
}

let changed = 0
for (const dir of SEARCH_DIRS) {
  for (const file of listPackageJsons(dir)) {
    if (updateFile(file)) {
      console.log(`Set version ${TARGET_VERSION} in ${path.relative(ROOT, file)}`)
      changed += 1
    }
  }
}

console.log(`Updated versions in ${changed} packages`)

