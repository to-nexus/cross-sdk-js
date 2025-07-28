#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const readline = require('readline')

// 여러 패키지 지원을 위한 배열
const PACKAGE_NAMES = [
  '@to-nexus/universal-provider'
  /*
   * 나중에 추가할 패키지들
   * '@to-nexus/sign-client',
   * '@to-nexus/core'
   */
]
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
      npmVersions: new Map() // 패키지별 버전 저장
    }

    for (const file of this.packageFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const packageJson = JSON.parse(content)

        let hasWorkspace = false
        let hasNpm = false
        const fileVersions = new Map()

        // 각 패키지별로 확인
        for (const packageName of PACKAGE_NAMES) {
          let found = false
          let version = null

          // Dependencies와 devDependencies 모두 확인
          for (const depType of ['dependencies', 'devDependencies']) {
            if (packageJson[depType]?.[packageName]) {
              found = true
              version = packageJson[depType][packageName]
              break
            }
          }

          if (found) {
            fileVersions.set(packageName, version)

            if (version === WORKSPACE_PATTERN) {
              hasWorkspace = true
            } else {
              hasNpm = true
              // 전체 npm 버전 추적
              if (!this.currentState.npmVersions.has(packageName)) {
                this.currentState.npmVersions.set(packageName, new Set())
              }
              this.currentState.npmVersions.get(packageName).add(version)
            }
          }
        }

        // 파일 분류
        if (fileVersions.size === 0) {
          this.currentState.notFound.push(file)
        } else if (hasWorkspace && !hasNpm) {
          this.currentState.workspace.push({ file, versions: fileVersions })
        } else if (hasNpm && !hasWorkspace) {
          this.currentState.npm.push({ file, versions: fileVersions })
        } else {
          // 혼합 상태 (일부는 workspace, 일부는 npm)
          this.currentState.npm.push({ file, versions: fileVersions, mixed: true })
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message)
      }
    }
  }

  // 특정 패키지의 npm에서 최신 버전 가져오기
  getLatestVersion(packageName) {
    try {
      const result = execSync(`npm view ${packageName} version`, { encoding: 'utf8' })

      return result.trim()
    } catch (error) {
      return null
    }
  }

  // 모든 패키지의 최신 버전 가져오기
  getAllLatestVersions() {
    const latestVersions = new Map()

    for (const packageName of PACKAGE_NAMES) {
      const version = this.getLatestVersion(packageName)
      if (version) {
        latestVersions.set(packageName, version)
      }
    }

    return latestVersions
  }

  // 상태 출력
  printCurrentState() {
    console.log('\n=== Current State ===')
    console.log(`Managed packages: ${PACKAGE_NAMES.join(', ')}`)

    console.log(`\nWorkspace files: ${this.currentState.workspace.length}`)
    this.currentState.workspace.forEach(({ file, versions }) => {
      console.log(`  ${file}`)
      versions.forEach((version, packageName) => {
        console.log(`    ${packageName}: ${version}`)
      })
    })

    console.log(`\nNPM version files: ${this.currentState.npm.length}`)
    this.currentState.npm.forEach(({ file, versions, mixed }) => {
      console.log(`  ${file}${mixed ? ' (mixed)' : ''}`)
      versions.forEach((version, packageName) => {
        console.log(`    ${packageName}: ${version}`)
      })
    })

    if (this.currentState.npmVersions.size > 0) {
      console.log('\nNPM versions in use:')
      this.currentState.npmVersions.forEach((versions, packageName) => {
        console.log(`  ${packageName}: ${Array.from(versions).join(', ')}`)
      })
    }
  }

  // 백업 생성
  createBackup() {
    const backupDir = `backups/backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
    fs.mkdirSync(backupDir, { recursive: true })

    this.packageFiles.forEach((file, index) => {
      const backupName = `package-${index}-${path.basename(path.dirname(file)) || 'root'}.json`
      fs.copyFileSync(file, path.join(backupDir, backupName))
    })

    console.log(`\n✅ Backup created: ${backupDir}`)

    return backupDir
  }

  // Package.json 업데이트 (모든 관리 대상 패키지)
  updatePackageJson(filePath, targetVersions) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const packageJson = JSON.parse(content)
      let modified = false

      // 각 패키지별로 업데이트
      for (const packageName of PACKAGE_NAMES) {
        const targetVersion = targetVersions.get ? targetVersions.get(packageName) : targetVersions

        for (const depType of ['dependencies', 'devDependencies']) {
          if (packageJson[depType]?.[packageName]) {
            packageJson[depType][packageName] = targetVersion
            modified = true
          }
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
    console.log(`Packages: ${PACKAGE_NAMES.join(', ')}`)

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
    console.log('\n📦 Getting latest versions...')
    const latestVersions = this.getAllLatestVersions()

    console.log('\n📦 NPM Version Options:')
    console.log('  1) Use latest versions for all packages')
    latestVersions.forEach((version, packageName) => {
      console.log(`     ${packageName}: ${version}`)
    })

    console.log('  2) Use current npm versions (if any)')
    this.currentState.npmVersions.forEach((versions, packageName) => {
      const versionList = Array.from(versions)
      if (versionList.length > 0) {
        console.log(`     ${packageName}: ${versionList[0]}`) // 첫 번째 버전 사용
      }
    })

    console.log('  3) Enter custom versions for each package')
    console.log('  4) Cancel')

    const choice = await this.askQuestion('\nSelect option: ')

    let targetVersions = new Map()

    switch (choice) {
      case '1':
        targetVersions = latestVersions
        break
      case '2':
        this.currentState.npmVersions.forEach((versions, packageName) => {
          const versionList = Array.from(versions)
          if (versionList.length > 0) {
            targetVersions.set(packageName, versionList[0])
          } else if (latestVersions.has(packageName)) {
            targetVersions.set(packageName, latestVersions.get(packageName))
          }
        })
        break
      case '3':
        for (const packageName of PACKAGE_NAMES) {
          const currentLatest = latestVersions.get(packageName) || 'unknown'
          const version = await this.askQuestion(
            `Enter version for ${packageName} (latest: ${currentLatest}): `
          )
          if (version) {
            targetVersions.set(packageName, version)
          } else if (latestVersions.has(packageName)) {
            targetVersions.set(packageName, latestVersions.get(packageName))
          }
        }
        break
      case '4':
        console.log('Cancelled')

        return
      default:
        console.log('❌ Invalid option')

        return
    }

    if (targetVersions.size === 0) {
      console.log('❌ No versions specified')

      return
    }

    console.log('\n🔄 Switching to npm versions:')
    targetVersions.forEach((version, packageName) => {
      console.log(`  ${packageName}: ${version}`)
    })

    this.createBackup()
    let updated = 0

    for (const file of this.packageFiles) {
      if (this.updatePackageJson(file, targetVersions)) {
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
    console.log(`Packages: ${PACKAGE_NAMES.join(', ')}`)

    this.analyzeCurrentState()
    this.printCurrentState()

    console.log('\n📋 Actions:')
    console.log('  1) Switch to workspace:*')
    console.log('  2) Switch to npm version')
    console.log('  3) Check latest npm versions')
    console.log('  4) Add/Remove packages')
    console.log('  5) Exit')

    const choice = await this.askQuestion('\nSelect action (1-5): ')

    switch (choice) {
      case '1':
        await this.switchToWorkspace()
        break
      case '2':
        await this.switchToNpm()
        break
      case '3': {
        console.log('\n📦 Checking latest versions...')
        const latestVersions = this.getAllLatestVersions()
        latestVersions.forEach((version, packageName) => {
          console.log(`  ${packageName}: ${version}`)
        })
        break
      }
      case '4':
        await this.managePackages()
        break
      case '5':
        console.log('👋 Goodbye!')
        rl.close()

        return
      default:
        console.log('❌ Invalid option')
    }

    // 메뉴로 돌아가기
    setTimeout(() => this.showMainMenu(), 1000)
  }

  // 패키지 관리 (추가/제거)
  async managePackages() {
    console.log('\n📦 Package Management:')
    console.log('Current packages:')
    PACKAGE_NAMES.forEach((pkg, index) => {
      console.log(`  ${index + 1}) ${pkg}`)
    })

    console.log('\nOptions:')
    console.log('  a) Add package')
    console.log('  r) Remove package')
    console.log('  b) Back to main menu')

    const choice = await this.askQuestion('\nSelect option: ')

    switch (choice.toLowerCase()) {
      case 'a': {
        const newPackage = await this.askQuestion(
          'Enter package name (e.g., @to-nexus/sign-client): '
        )
        if (newPackage && !PACKAGE_NAMES.includes(newPackage)) {
          PACKAGE_NAMES.push(newPackage)
          console.log(`✅ Added ${newPackage}`)
        } else if (PACKAGE_NAMES.includes(newPackage)) {
          console.log(`⚠️ ${newPackage} already exists`)
        }
        break
      }
      case 'r': {
        if (PACKAGE_NAMES.length <= 1) {
          console.log('⚠️ Cannot remove the last package')
          break
        }

        const indexStr = await this.askQuestion('Enter package number to remove: ')
        const index = parseInt(indexStr) - 1

        if (index >= 0 && index < PACKAGE_NAMES.length) {
          const removed = PACKAGE_NAMES.splice(index, 1)[0]
          console.log(`✅ Removed ${removed}`)
        } else {
          console.log('❌ Invalid package number')
        }
        break
      }
      case 'b':
        return
      default:
        console.log('❌ Invalid option')
    }
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
