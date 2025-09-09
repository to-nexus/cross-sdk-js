const fs = require('fs');
const path = require('path');

/**
 * 버전 결정 우선순위
 * 1) env.PUBLISH_VERSION 또는 env.RELEASE_VERSION
 * 2) version.json (repo root)
 * 3) 릴리스 브랜치명(release/vX.Y.Z)
 *
 * 릴리스 타입은 env.RELEASE_TYPE(기본: minor)
 * 패키지 목록은 version.json.packages 또는 .changeset/config.json.linked[0]
 */
function generateChangeset() {
  try {
    const changesetDir = path.join(process.cwd(), '.changeset');
    if (!fs.existsSync(changesetDir)) {
      fs.mkdirSync(changesetDir, { recursive: true });
    }

    // 1) 환경변수 우선
    const envVersionRaw = (process.env.PUBLISH_VERSION || process.env.RELEASE_VERSION || '').trim();
    const envVersion = envVersionRaw.replace(/^v/, '');

    // 2) version.json
    let versionData = null;
    const versionJsonPath = path.join(process.cwd(), 'version.json');
    if (fs.existsSync(versionJsonPath)) {
      try {
        versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
      } catch {}
    }

    // 3) 브랜치명(release/X.Y.Z)
    const gitRef = process.env.GITHUB_REF || '';
    const refName = process.env.GITHUB_REF_NAME || gitRef.split('/').slice(3).join('/');
    const branchMatch = (refName || '').match(/^release\/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);

    const derivedVersion = envVersion || versionData?.version || (branchMatch ? branchMatch[1] : null);
    if (!derivedVersion) {
      throw new Error('릴리스 버전을 결정할 수 없습니다. PUBLISH_VERSION 또는 release/X.Y.Z 브랜치명을 확인하세요.');
    }
    const releaseType = (process.env.RELEASE_TYPE || 'minor').toLowerCase();

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

    const title = `Release ${derivedVersion}`;
    const notes = '';

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

    fs.writeFileSync(filepath, changesetContent, 'utf8');
    console.log(`✅ Changeset 파일 생성됨: ${filename}`);
    console.log(`📝 버전: ${derivedVersion}`);
    console.log(`🔄 릴리스 타입: ${releaseType}`);
  } catch (error) {
    console.error('❌ Changeset 생성 중 오류 발생:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateChangeset();
}

module.exports = { generateChangeset };


