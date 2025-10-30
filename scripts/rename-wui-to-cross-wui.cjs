#!/usr/bin/env node

/**
 * Cross SDK의 모든 wui-* Web Components를 cross-wui-*로 일괄 변경하는 스크립트
 * Reown SDK와의 Web Components 이름 충돌을 방지하기 위함
 * 
 * Usage:
 *   node scripts/rename-wui-to-cross-wui.js --dry-run  # 미리보기 (실제 변경 안함)
 *   node scripts/rename-wui-to-cross-wui.js            # 실제 변경
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Dry-run 모드 체크
const isDryRun = process.argv.includes('--dry-run')

// 변경할 디렉토리들
const TARGET_DIRS = [
  'packages/ui',
  'packages/scaffold-ui',
  'packages/appkit',
  'packages/wallet-button',
  'packages/experimental'
]

// 파일 확장자 패턴
const FILE_PATTERNS = ['*.ts', '*.tsx', '*.js', '*.jsx']

// wui-로 시작하는 패턴들
// ⚠️ 주의: import 경로(폴더명)는 제외!
const PATTERNS = [
  // @customElement('wui-*')
  {
    regex: /@customElement\(['"]wui-([^'"]+)['"]\)/g,
    replacement: "@customElement('cross-wui-$1')"
  },

  // customElements.define('wui-*')
  {
    regex: /customElements\.define\(['"]wui-([^'"]+)['"]\)/g,
    replacement: "customElements.define('cross-wui-$1')"
  },

  // HTML 템플릿: <wui-*>
  { regex: /<wui-([a-z-]+)/g, replacement: '<cross-wui-$1' },
  { regex: /<\/wui-([a-z-]+)>/g, replacement: '</cross-wui-$1>' },

  // CSS 선택자: wui-*
  { regex: /\bwui-([a-z-]+)\s*\{/g, replacement: 'cross-wui-$1 {' },
  { regex: /\bwui-([a-z-]+)\s*,/g, replacement: 'cross-wui-$1,' },

  // querySelector/querySelectorAll('wui-*')
  { regex: /querySelector\(['"]wui-([^'"]+)['"]\)/g, replacement: "querySelector('cross-wui-$1')" },
  {
    regex: /querySelectorAll\(['"]wui-([^'"]+)['"]\)/g,
    replacement: "querySelectorAll('cross-wui-$1')"
  },

  // TypeScript 인터페이스: 'wui-*': CustomElement
  {
    regex: /['"]wui-([a-z-]+)['"]\s*:\s*CustomElement/g,
    replacement: "'cross-wui-$1': CustomElement"
  }
]

// ❌ import 경로는 바꾸지 않음! (폴더명은 수동으로 변경해야 함)
// 예: import '../wui-card/index.js' → 그대로 유지
//     @customElement('wui-card') → @customElement('cross-wui-card')

console.log(`🚀 Cross SDK Web Components 이름 변경 ${isDryRun ? '(DRY-RUN 모드)' : '시작'}...\n`)
if (isDryRun) {
  console.log('⚠️  실제 파일은 변경되지 않습니다. 미리보기만 표시됩니다.\n')
}

let totalFiles = 0
let totalReplacements = 0
let exampleChanges = [] // 예시 변경사항 저장

TARGET_DIRS.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir)

  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  ${dir} 디렉토리가 존재하지 않습니다. 건너뜁니다.`)
    return
  }

  console.log(`📁 ${dir} 처리 중...`)

  // 모든 .ts, .tsx, .js, .jsx 파일 찾기
  FILE_PATTERNS.forEach(pattern => {
    try {
      const files = execSync(`find ${dirPath} -type f -name "${pattern}"`, { encoding: 'utf-8' })
        .split('\n')
        .filter(f => f.trim() && !f.includes('node_modules') && !f.includes('dist'))

      files.forEach(filePath => {
        let content = fs.readFileSync(filePath, 'utf-8')
        let modified = false
        let fileReplacements = 0

        // 모든 패턴 적용
        PATTERNS.forEach(({ regex, replacement }) => {
          const matches = content.match(regex)
          if (matches) {
            // 첫 3개 예시만 저장 (dry-run용)
            if (isDryRun && exampleChanges.length < 5) {
              matches.slice(0, 3).forEach(match => {
                const replaced = match.replace(regex, replacement)
                exampleChanges.push({
                  file: path.relative(process.cwd(), filePath),
                  before: match,
                  after: replaced
                })
              })
            }
            
            content = content.replace(regex, replacement)
            fileReplacements += matches.length
            modified = true
          }
        })

        if (modified) {
          // Dry-run이 아닐 때만 실제 파일 쓰기
          if (!isDryRun) {
            fs.writeFileSync(filePath, content, 'utf-8')
          }
          console.log(`  ${isDryRun ? '📝' : '✅'} ${path.relative(process.cwd(), filePath)} (${fileReplacements} 변경)`)
          totalFiles++
          totalReplacements += fileReplacements
        }
      })
    } catch (error) {
      // find 명령어 오류 무시 (파일 없음 등)
    }
  })
})

console.log(`\n✨ ${isDryRun ? '미리보기 완료!' : '완료!'}`)
console.log(`📊 통계:`)
console.log(`  - 수정될 파일: ${totalFiles}개`)
console.log(`  - 총 변경 횟수: ${totalReplacements}회`)

if (isDryRun && exampleChanges.length > 0) {
  console.log(`\n📝 변경 예시 (처음 5개):`)
  exampleChanges.forEach(({ file, before, after }, idx) => {
    console.log(`  ${idx + 1}. ${file}`)
    console.log(`     Before: ${before}`)
    console.log(`     After:  ${after}`)
  })
  console.log(`\n🚀 실제 변경하려면 --dry-run 없이 실행하세요:`)
  console.log(`   node scripts/rename-wui-to-cross-wui.js`)
} else if (!isDryRun) {
  console.log(`\n⚠️  주의사항:`)
  console.log(`  1. 변경사항을 git diff로 확인하세요`)
  console.log(`  2. pnpm build를 실행하여 빌드가 성공하는지 확인하세요`)
  console.log(`  3. 문제가 있다면 git restore로 되돌릴 수 있습니다`)
}
