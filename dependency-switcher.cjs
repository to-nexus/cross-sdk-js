#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const readline = require('readline')

const PACKAGE_NAME = '@to-nexus/universal-provider'
const WORKSPACE_PATTERN = 'workspace:*'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

class DependencySwitcher {
  constructor() {
    this.packageFiles = []
    this.currentState = {}
  }

  // Package.json 파일들 찾기
  findPackageFiles() {
    const files = []

    function walk(dir) {
      const items = fs.readdirSync(dir)

      for (const item of items) {
        if (item === 'node_modules' || item.startsWith('backup')) {
          continue
        }

        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          walk(fullPath)
        } else if (item === 'package.json') {
          files.push(fullPath)
        }
      }
    }

    walk('.')

    return files
  }

  // 현재 상태 분석
  analyzeCurrentState() {
    this.packageFiles = this.findPackageFiles()
    this.currentState = {
      workspace: [],
      npm: [],
      notFound: [],
      npmVersions: new Set()
    }

    for (const file of this.packageFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const packageJson = JSON.parse(content)

        let found = false
        let version = null

        // Dependencies와 devDependencies 모두 확인
        for (const depType of ['dependencies', 'devDependencies']) {
          if (packageJson[depType]?.[PACKAGE_NAME]) {
            found = true
            version = packageJson[depType][PACKAGE_NAME]
            break
          }
        }

        if (!found) {
          this.currentState.notFound.push(file)
        } else if (version === WORKSPACE_PATTERN) {
          this.currentState.workspace.push(file)
        } else {
          this.currentState.npm.push(file)
          this.currentState.npmVersions.add(version)
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message)
      }
    }
  }

  // Npm에서 최신 버전 가져오기
  getLatestVersion() {
    try {
      const result = execSync(`npm view ${PACKAGE_NAME} version`, { encoding: 'utf8' })

      return result.trim()
    } catch (error) {
      return null
    }
  }

  // 상태 출력
  printCurrentState() {
    console.log('\n=== Current State ===')
    console.log(`Workspace files: ${this.currentState.workspace.length}`)
    this.currentState.workspace.forEach(file => console.log(`  ${file}`))

    console.log(`\nNPM version files: ${this.currentState.npm.length}`)
    this.currentState.npm.forEach(file => console.log(`  ${file}`))

    if (this.currentState.npmVersions.size > 0) {
      console.log(`\nNPM versions in use: ${Array.from(this.currentState.npmVersions).join(', ')}`)
    }
  }

  // 백업 생성
  createBackup() {
    const backupDir = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
    fs.mkdirSync(backupDir, { recursive: true })

    this.packageFiles.forEach((file, index) => {
      const backupName = `package-${index}-${path.basename(path.dirname(file)) || 'root'}.json`
      fs.copyFileSync(file, path.join(backupDir, backupName))
    })

    console.log(`\n✅ Backup created: ${backupDir}`)

    return backupDir
  }

  // Package.json 업데이트
  updatePackageJson(filePath, targetVersion) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const packageJson = JSON.parse(content)
      let modified = false

      for (const depType of ['dependencies', 'devDependencies']) {
        if (packageJson[depType]?.[PACKAGE_NAME]) {
          packageJson[depType][PACKAGE_NAME] = targetVersion
          modified = true
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, `${JSON.stringify(packageJson, null, 2)}\n`)

        return true
      }

      return false
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error.message)

      return false
    }
  }

  // Workspace로 스위칭
  async switchToWorkspace() {
    console.log('\n🔄 Switching to workspace:*...')

    this.createBackup()
    let updated = 0

    for (const file of this.packageFiles) {
      if (this.updatePackageJson(file, WORKSPACE_PATTERN)) {
        updated++
        console.log(`  ✅ ${file}`)
      }
    }

    console.log(`\n📊 Updated ${updated} files`)

    if (updated > 0) {
      await this.askReinstall()
    }
  }

  // Npm 버전으로 스위칭
  async switchToNpm() {
    const latestVersion = this.getLatestVersion()
    const currentVersions = Array.from(this.currentState.npmVersions)

    console.log('\n📦 NPM Version Options:')
    const options = []

    if (latestVersion) {
      console.log(`  1) Latest version: ${latestVersion}`)
      options.push(latestVersion)
    }

    currentVersions.forEach((version, index) => {
      if (version !== latestVersion) {
        console.log(`  ${options.length + 1}) Current version: ${version}`)
        options.push(version)
      }
    })

    console.log(`  ${options.length + 1}) Enter custom version`)
    console.log(`  ${options.length + 2}) Cancel`)

    const choice = await this.askQuestion('\nSelect option: ')
    const choiceNum = parseInt(choice)

    let targetVersion
    if (choiceNum >= 1 && choiceNum <= options.length) {
      targetVersion = options[choiceNum - 1]
    } else if (choiceNum === options.length + 1) {
      targetVersion = await this.askQuestion('Enter version: ')
    } else {
      console.log('Cancelled')

      return
    }

    if (!targetVersion) {
      console.log('❌ No version specified')

      return
    }

    console.log(`\n🔄 Switching to npm version: ${targetVersion}...`)

    this.createBackup()
    let updated = 0

    for (const file of this.packageFiles) {
      if (this.updatePackageJson(file, targetVersion)) {
        updated++
        console.log(`  ✅ ${file}`)
      }
    }

    console.log(`\n📊 Updated ${updated} files`)

    if (updated > 0) {
      await this.askReinstall()
    }
  }

  // 의존성 재설치 여부 묻기
  async askReinstall() {
    const reinstall = await this.askQuestion('\n🔄 Reinstall dependencies? (y/n): ')

    if (reinstall.toLowerCase() === 'y') {
      console.log('🧹 Cleaning and reinstalling...')
      try {
        execSync('rm -rf node_modules pnpm-lock.yaml package-lock.json', { stdio: 'inherit' })

        // Pnpm 우선, 없으면 npm
        try {
          execSync('pnpm install', { stdio: 'inherit' })
        } catch {
          execSync('npm install', { stdio: 'inherit' })
        }

        console.log('✅ Dependencies reinstalled')
      } catch (error) {
        console.error('❌ Reinstall failed:', error.message)
      }
    }
  }

  // 질문하기
  askQuestion(question) {
    return new Promise(resolve => {
      rl.question(question, resolve)
    })
  }

  // 메인 메뉴
  async showMainMenu() {
    console.log('\n=== Dependency Switcher ===')
    console.log(`Package: ${PACKAGE_NAME}`)

    this.analyzeCurrentState()
    this.printCurrentState()

    console.log('\n📋 Actions:')
    console.log('  1) Switch to workspace:*')
    console.log('  2) Switch to npm version')
    console.log('  3) Check latest npm version')
    console.log('  4) Exit')

    const choice = await this.askQuestion('\nSelect action (1-4): ')

    switch (choice) {
      case '1':
        await this.switchToWorkspace()
        break
      case '2':
        await this.switchToNpm()
        break
      case '3':
        const latest = this.getLatestVersion()
        console.log(`\n📦 Latest version: ${latest || 'Unable to fetch'}`)
        break
      case '4':
        console.log('👋 Goodbye!')
        rl.close()

        return
      default:
        console.log('❌ Invalid option')
    }

    // 메뉴로 돌아가기
    setTimeout(() => this.showMainMenu(), 1000)
  }

  // 시작
  async start() {
    await this.showMainMenu()
  }
}

// 실행
if (require.main === module) {
  const switcher = new DependencySwitcher()
  switcher.start().catch(console.error)
}
