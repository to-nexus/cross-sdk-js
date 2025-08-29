const fs = require('fs');
const path = require('path');

/**
 * version.json이 있으면 사용하고, 없으면
 * - 릴리스 브랜치명(release/vX.Y.Z)에서 버전을 파싱
 * - 릴리스 타입은 env(RELEASE_TYPE) 또는 기본 minor
 * - 패키지 목록은 .changeset/config.json의 linked 그룹에서 로드
 */
function generateChangeset() {
  try {
    const changesetDir = path.join(process.cwd(), '.changeset');
    if (!fs.existsSync(changesetDir)) {
      fs.mkdirSync(changesetDir, { recursive: true });
    }

    // 1) version.json 시도
    let versionData = null;
    const versionPath = path.join(process.cwd(), 'version.json');
    if (fs.existsSync(versionPath)) {
      versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    }

    // 2) fallback: 브랜치와 설정에서 유도
    const gitRef = process.env.GITHUB_REF || '';
    const refName = process.env.GITHUB_REF_NAME || gitRef.split('/').slice(3).join('/');
    const branchMatch = (refName || '').match(/^release\/v?(\S+)$/);
    const derivedVersion = versionData?.version || (branchMatch ? branchMatch[1] : null);
    if (!derivedVersion) {
      throw new Error('릴리스 버전을 결정할 수 없습니다. version.json 또는 release/vX.Y.Z 브랜치명을 확인하세요.');
    }

    const releaseType = (process.env.RELEASE_TYPE || versionData?.releaseType || 'minor').toLowerCase();

    // 패키지 목록: version.json이 있으면 그걸, 없으면 .changeset/config.json에서 linked 그룹 사용
    let packages = versionData?.packages ? Object.keys(versionData.packages) : [];
    if (!packages.length) {
      try {
        const changesetConfigPath = path.join(process.cwd(), '.changeset', 'config.json');
        const config = JSON.parse(fs.readFileSync(changesetConfigPath, 'utf8'));
        if (Array.isArray(config.linked) && Array.isArray(config.linked[0])) {
          packages = config.linked[0];
        }
      } catch {
        // ignore
      }
    }
    if (!packages.length) {
      throw new Error('패키지 목록을 로드하지 못했습니다. version.json 또는 .changeset/config.json의 linked 설정을 확인하세요.');
    }

    const title = versionData?.releaseTitle || `Release ${derivedVersion}`;
    const notes = versionData?.releaseNotes || '';

    const timestamp = Date.now();
    const filename = `release-${derivedVersion.replace(/\./g, '-')}-${timestamp}.md`;
    const filepath = path.join(changesetDir, filename);

    // changeset 파일 생성
    let changesetContent = '---\n';
    packages.forEach(packageName => {
      changesetContent += `"${packageName}": ${releaseType}\n`;
    });
    changesetContent += '---\n\n';
    changesetContent += `# ${title}\n\n`;
    if (notes) {
      changesetContent += `${notes}\n\n`;
    }
    if (versionData?.changelog && versionData.changelog.length > 0) {
      changesetContent += '## 변경사항\n\n';
      versionData.changelog.forEach(change => {
        const prefix = getChangePrefix(change.type);
        changesetContent += `${prefix} ${change.message}\n`;
      });
    }

    fs.writeFileSync(filepath, changesetContent, 'utf8');
    console.log(`✅ Changeset 파일 생성됨: ${filename}`);
    console.log(`📝 버전: ${derivedVersion}`);
    console.log(`🔄 릴리스 타입: ${releaseType}`);
  } catch (error) {
    console.error('❌ Changeset 생성 중 오류 발생:', error.message);
    process.exit(1);
  }
}

function getChangePrefix(type) {
  switch (type) {
    case 'feat': return '✨';
    case 'fix': return '🐛';
    case 'perf': return '⚡';
    case 'refactor': return '♻️';
    case 'docs': return '📝';
    case 'test': return '✅';
    case 'chore': return '🔧';
    default: return '•';
  }
}

if (require.main === module) {
  generateChangeset();
}

module.exports = { generateChangeset };


