#!/bin/bash

# Sample page build를 위한 패키지 버전 해결 스크립트
# Usage: ./scripts/resolve-sample-versions.sh <environment>
# Environment: dev (alpha), stage (beta), prod (latest)

set -e

# Check if we're using bash 4+ for associative arrays
if [ "${BASH_VERSION%%.*}" -lt 4 ]; then
  echo "⚠️  This script requires bash 4+ for associative arrays. Using fallback mode."
  USE_ASSOCIATIVE_ARRAY=false
else
  USE_ASSOCIATIVE_ARRAY=true
fi

ENVIRONMENT=${1:-prod}
WORKDIR=${2:-$(pwd)}

echo "🔍 Resolving package versions for $ENVIRONMENT environment..."

# 환경별 dist-tag 설정
case "$ENVIRONMENT" in
  "dev")
    DIST_TAG="alpha"
    ;;
  "stage") 
    DIST_TAG="beta"
    ;;
  "prod")
    DIST_TAG="latest"
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid options: dev, stage, prod"
    exit 1
    ;;
esac

echo "Target dist-tag: $DIST_TAG"

# 버전 해결 함수 - alpha/beta가 없으면 latest로 fallback
resolve_version() {
  local pkg="$1" tag="$2"
  local version
  
  # 먼저 지정된 태그로 시도
  version=$(npm view "${pkg}@${tag}" version 2>/dev/null || echo "")
  
  if [ -z "$version" ]; then
    echo "⚠️  ${pkg}@${tag} not found, falling back to latest" >&2
    version=$(npm view "${pkg}@latest" version 2>/dev/null || echo "")
  fi
  
  if [ -z "$version" ]; then
    echo "❌ ${pkg}: version resolution completely failed" >&2
    return 1
  fi
  
  echo "$version"
}

# examples에서 사용 중인 @to-nexus 패키지들을 동적으로 수집
collect_used_packages() {
  local workdir="$1"
  local packages=()
  
  echo "🔍 Scanning examples for @to-nexus packages..." >&2
  
  # examples의 모든 package.json에서 @to-nexus 패키지 찾기
  for example_dir in "$workdir"/examples/*/; do
    if [ -f "$example_dir/package.json" ]; then
      local example_name=$(basename "$example_dir")
      echo "  Scanning $example_name..." >&2
      
      # dependencies와 devDependencies에서 @to-nexus 패키지 추출
      local found_packages=$(node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$example_dir/package.json', 'utf8'));
        const nexusPackages = new Set();
        
        ['dependencies', 'devDependencies'].forEach(section => {
          if (pkg[section]) {
            Object.keys(pkg[section]).forEach(pkgName => {
              if (pkgName.startsWith('@to-nexus/')) {
                nexusPackages.add(pkgName);
              }
            });
          }
        });
        
        Array.from(nexusPackages).forEach(pkg => console.log(pkg));
      " 2>/dev/null)
      
      # 결과를 배열에 추가
      while IFS= read -r pkg; do
        if [[ -n "$pkg" && ! " ${packages[@]} " =~ " $pkg " ]]; then
          packages+=("$pkg")
          echo "    Found: $pkg" >&2
        fi
      done <<< "$found_packages"
    fi
  done
  
  # 배열을 공백으로 구분된 문자열로 출력
  printf '%s\n' "${packages[@]}"
}

# 사용 중인 패키지 목록 동적 수집 (호환성 개선)
PACKAGES=()
TEMP_FILE=$(mktemp)
collect_used_packages "$WORKDIR" > "$TEMP_FILE"
while IFS= read -r pkg; do
  if [[ -n "$pkg" ]]; then
    PACKAGES+=("$pkg")
  fi
done < "$TEMP_FILE"
rm -f "$TEMP_FILE"

# 패키지가 하나도 없으면 기본 패키지 사용
if [ ${#PACKAGES[@]} -eq 0 ]; then
  echo "⚠️  No @to-nexus packages found in examples, using fallback list"
  PACKAGES=(
    "@to-nexus/sdk"
    "@to-nexus/core"
    "@to-nexus/appkit"
  )
fi

echo "📦 Found ${#PACKAGES[@]} @to-nexus packages to resolve"

# 버전 해결 (호환성 모드)
echo "📦 Resolving versions:"

# 버전 정보를 저장할 임시 파일
VERSIONS_FILE=$(mktemp)

for pkg in "${PACKAGES[@]}"; do
  if version=$(resolve_version "$pkg" "$DIST_TAG"); then
    echo "${pkg}=${version}" >> "$VERSIONS_FILE"
    echo "  $pkg: $version"
  else
    echo "  ⚠️  $pkg: skipping due to resolution failure"
  fi
done

# examples 디렉토리의 package.json 파일들 업데이트
update_package_json() {
  local pkg_file="$1"
  local versions_file="$2"
  
  # 버전 정보를 JSON 형태로 변환
  local versions_json=$(node -e "
    const fs = require('fs');
    const versions = {};
    const content = fs.readFileSync('$versions_file', 'utf8').trim();
    if (content) {
      content.split('\n').forEach(line => {
        const [pkg, ver] = line.split('=');
        if (pkg && ver) versions[pkg] = ver;
      });
    }
    console.log(JSON.stringify(versions));
  ")
  
  node -e "
    const fs = require('fs');
    const path = '$pkg_file';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    const versions = JSON.parse('$versions_json');
    let updated = false;
    
    ['dependencies', 'devDependencies'].forEach(section => {
      if (pkg[section]) {
        Object.keys(versions).forEach(pkgName => {
          if (pkg[section][pkgName] && versions[pkgName]) {
            console.log(\`  \${pkgName}: \${pkg[section][pkgName]} -> \${versions[pkgName]}\`);
            pkg[section][pkgName] = versions[pkgName];
            updated = true;
          }
        });
      }
    });
    
    if (updated) {
      fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
      console.log(\`  ✅ Updated \${path}\`);
    } else {
      console.log(\`  ℹ️  No updates needed for \${path}\`);
    }
  " versions_json="$versions_json"
}

# examples의 package.json 파일들 업데이트
if [ "$ENVIRONMENT" != "prod" ]; then
  echo ""
  echo "🔧 Updating example package.json files..."
  
  for example_dir in "$WORKDIR"/examples/*/; do
    if [ -f "$example_dir/package.json" ]; then
      echo "Updating $(basename "$example_dir")/package.json"
      update_package_json "$example_dir/package.json" "$VERSIONS_FILE"
    fi
  done
else
  echo "🚀 Production build - using workspace versions (no updates needed)"
fi

# 임시 파일 정리
rm -f "$VERSIONS_FILE"

echo ""
echo "✅ Version resolution completed for $ENVIRONMENT environment"
