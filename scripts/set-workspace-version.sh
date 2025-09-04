#!/bin/bash

# 환경별 workspace 버전 설정 스크립트
# Usage: ./scripts/set-workspace-version.sh <environment>

set -e

ENVIRONMENT=${1:-prod}

echo "🔧 Setting workspace version for $ENVIRONMENT environment..."

case "$ENVIRONMENT" in
  "dev")
    echo "Using alpha version for dev environment"
    # alpha 버전은 이미 설정되어 있으므로 변경 없음
    ;;
  "stage")
    echo "Setting workspace version to beta for stage environment..."
    
    # .npmrc에서 레지스트리 URL 추출
    if [ -f ".npmrc" ]; then
      REGISTRY_URL=$(grep "@to-nexus:registry" .npmrc | cut -d'=' -f2)
      echo "Using registry: $REGISTRY_URL"
      
      # 레지스트리에서 beta 버전 존재 확인
      BETA_CHECK=$(curl -s "${REGISTRY_URL}%40to-nexus%2Fsdk" 2>/dev/null | grep -o '"beta":"[^"]*"' || echo "")
      
      # package.json 업데이트
      node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const baseVersion = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
        const betaCheck = process.env.BETA_CHECK;
        
        if (betaCheck && betaCheck.includes('beta')) {
          const betaVersion = baseVersion + '-beta';
          console.log('✅ Beta version exists in registry, using:', betaVersion);
          pkg.version = betaVersion;
        } else {
          console.log('⚠️  Beta version not found, using stable:', baseVersion);
          pkg.version = baseVersion;
        }
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('Workspace version set to:', pkg.version);
      " BETA_CHECK="$BETA_CHECK"
    else
      echo "No .npmrc found, using stable version"
      node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.version = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('Workspace version updated to:', pkg.version);
      "
    fi
    ;;
  "prod")
    echo "Setting stable version for production..."
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      pkg.version = pkg.version.replace(/-alpha.*$/, '').replace(/-beta.*$/, '');
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      console.log('Workspace version updated to:', pkg.version);
    "
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid options: dev, stage, prod"
    exit 1
    ;;
esac

echo "✅ Workspace version configuration completed for $ENVIRONMENT"
