#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prerelease 버전 번호를 자동으로 증가시키는 스크립트 (alpha, beta 지원)
 * 
 * 사용법:
 * - npm run prerelease:increment [base-version] [environment]
 * - 예: npm run prerelease:increment 2.1.0 dev (alpha)
 * - 예: npm run prerelease:increment 2.1.0 stage (beta)
 * 
 * 동작:
 * 1. 현재 Nexus 레지스트리에서 해당 베이스 버전의 최신 prerelease 번호를 확인
 * 2. 다음 prerelease 번호로 증가 (alpha.1, beta.1 등)
 * 3. 모든 패키지 버전을 업데이트
 */

// 환경별 레지스트리 URL 결정
function getRegistryUrl(environment = 'stage') {
  const registries = {
    dev: process.env.NEXUS_DEV_REGISTRY_URL,
    stage: process.env.NEXUS_STAGE_REGISTRY_URL,
    prod: process.env.NEXUS_REGISTRY_URL
  };
  
  return registries[environment] || registries.stage;
}

// NPM 레지스트리에서 패키지의 모든 버전 조회
function getPackageVersions(packageName, registryUrl) {
  try {
    const command = `npm view ${packageName} versions --json --registry=${registryUrl}`;
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return JSON.parse(output);
  } catch (error) {
    console.log(`패키지 ${packageName}의 버전 정보를 가져올 수 없습니다:`, error.message);
    return [];
  }
}

// 특정 베이스 버전의 최신 prerelease 번호 찾기 (alpha, beta 지원)
function getLatestPrereleaseNumber(versions, baseVersion, prereleaseType) {
  const prereleaseVersions = versions
    .filter(v => v.startsWith(`${baseVersion}-${prereleaseType}`))
    .map(v => {
      const match = v.match(new RegExp(`^(.+)-${prereleaseType}\\.(\\d+)$`));
      if (match) {
        return {
          version: v,
          number: parseInt(match[2], 10)
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.number - a.number);

  return prereleaseVersions.length > 0 ? prereleaseVersions[0].number : -1;
}

// 다음 prerelease 버전 생성 (alpha, beta 지원)
function getNextPrereleaseVersion(baseVersion, environment = 'stage') {
  const registryUrl = getRegistryUrl(environment);
  const prereleaseType = environment === 'dev' ? 'alpha' : 'beta';
  
  console.log(`레지스트리 URL: ${registryUrl}`);
  console.log(`Prerelease 타입: ${prereleaseType}`);
  
  // 대표 패키지로 @to-nexus/core 사용하여 버전 확인
  const coreVersions = getPackageVersions('@to-nexus/core', registryUrl);
  const latestPrereleaseNumber = getLatestPrereleaseNumber(coreVersions, baseVersion, prereleaseType);
  
  const nextPrereleaseNumber = latestPrereleaseNumber + 1;
  const nextVersion = `${baseVersion}-${prereleaseType}.${nextPrereleaseNumber}`;
  
  console.log(`현재 최신 ${prereleaseType} 번호: ${latestPrereleaseNumber >= 0 ? latestPrereleaseNumber : '없음'}`);
  console.log(`다음 ${prereleaseType} 버전: ${nextVersion}`);
  
  return nextVersion;
}

// 워크스페이스의 모든 패키지 버전 업데이트
function updateWorkspaceVersions(version) {
  try {
    console.log(`워크스페이스 버전을 ${version}으로 업데이트 중...`);
    execSync(`pnpm run version:set "${version}"`, { stdio: 'inherit' });
    console.log('워크스페이스 버전 업데이트 완료');
  } catch (error) {
    console.error('워크스페이스 버전 업데이트 실패:', error.message);
    process.exit(1);
  }
}

// 메인 함수
function main() {
  const args = process.argv.slice(2);
  const baseVersion = args[0];
  const environment = args[1] || 'stage';
  
  if (!baseVersion) {
    console.error('사용법: node increment-alpha-beta-version.js <base-version> [environment]');
    console.error('예: node increment-alpha-beta-version.js 2.1.0 dev (alpha)');
    console.error('예: node increment-alpha-beta-version.js 2.1.0 stage (beta)');
    process.exit(1);
  }
  
  // 베이스 버전 형식 검증
  if (!/^\d+\.\d+\.\d+$/.test(baseVersion)) {
    console.error('베이스 버전은 semver 형식이어야 합니다 (예: 2.1.0)');
    process.exit(1);
  }
  
  try {
    const nextPrereleaseVersion = getNextPrereleaseVersion(baseVersion, environment);
    updateWorkspaceVersions(nextPrereleaseVersion);
    
    const prereleaseType = environment === 'dev' ? 'Alpha' : 'Beta';
    console.log(`\n✅ ${prereleaseType} 버전 증가 완료!`);
    console.log(`새 버전: ${nextPrereleaseVersion}`);
    
    // 버전 정보를 환경변수로 출력 (GitHub Actions에서 사용 가능)
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `NEXT_PRERELEASE_VERSION=${nextPrereleaseVersion}\n`);
    }
    
  } catch (error) {
    console.error('Prerelease 버전 증가 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  getNextPrereleaseVersion,
  updateWorkspaceVersions,
  getLatestPrereleaseNumber,
  getPackageVersions
};
