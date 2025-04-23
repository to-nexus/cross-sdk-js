const fs = require('fs');
const path = require('path');

const rootPackageJsonPath = path.resolve(__dirname, '../package.json');
const changesetConfigPath = path.resolve(__dirname, '../.changeset/config.json');

try {
  // 루트 package.json 읽기
  const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
  const rootVersion = rootPackageJson.version;
  const workspaces = rootPackageJson.workspaces || [];

  if (!rootVersion) {
    console.error('Error: Root package.json does not contain a version.');
    process.exit(1);
  }

  // Changeset config 읽기
  const changesetConfig = JSON.parse(fs.readFileSync(changesetConfigPath, 'utf8'));
  const linkedGroups = changesetConfig.linked || [];

  if (linkedGroups.length === 0) {
    console.log('No linked packages found in .changeset/config.json. Skipping version injection.');
    process.exit(0);
  }

  // 첫 번째 링크 그룹 사용 (cross-connect 구조 기준)
  const linkedPackages = linkedGroups[0];
  console.log(`Injecting version ${rootVersion} into linked packages: ${linkedPackages.join(', ')}`);

  // 작업 공간 디렉토리 목록 생성 (glob 패턴 처리 없이 단순화)
  // 실제 환경에서는 glob 패턴을 해석해야 할 수 있습니다.
  const workspaceDirs = workspaces.map(ws => path.resolve(__dirname, '..', ws));

  let updatedCount = 0;

  // 링크된 각 패키지에 대해 버전 업데이트
  linkedPackages.forEach(packageName => {
    let packageFound = false;
    workspaceDirs.forEach(wsDir => {
       // 간단하게 workspace 정의 자체가 패키지 경로라고 가정
       // 실제로는 wsDir 내의 package.json을 읽어 name 필드를 비교해야 함
       const potentialPackageJsonPath = path.join(wsDir, 'package.json');

       if (fs.existsSync(potentialPackageJsonPath)) {
         try {
           const packageJson = JSON.parse(fs.readFileSync(potentialPackageJsonPath, 'utf8'));
           if (packageJson.name === packageName) {
             packageFound = true;
             if (packageJson.version !== rootVersion) {
               console.log(`Updating ${packageName} from ${packageJson.version} to ${rootVersion}`);
               packageJson.version = rootVersion;
               fs.writeFileSync(potentialPackageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
               updatedCount++;
             } else {
               console.log(`${packageName} is already at version ${rootVersion}.`);
             }
           }
         } catch (readErr) {
           console.error(`Error processing ${potentialPackageJsonPath}:`, readErr);
         }
       }
    });
    if (!packageFound) {
         // workspaces 배열에 있는 패턴과 실제 패키지 이름이 다를 수 있음
         // 보다 정확한 구현을 위해서는 workspace 패턴을 해석하거나
         // lerna/pnpm 등의 도구를 활용하여 패키지 위치를 찾아야 함
         console.warn(`Warning: Could not find package directory for ${packageName} based on workspace definition. Manual check might be required.`);
     }

  });


  if (updatedCount > 0) {
    console.log(`Successfully updated version for ${updatedCount} package(s).`);
  } else {
    console.log('No package versions needed updating.');
  }

} catch (error) {
  console.error('Error injecting version:', error);
  process.exit(1);
} 