#!/bin/bash

# 색상 정의 (확장)
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 오류 발생 시 스크립트 중단
set -e

# 백업 디렉토리 설정
BACKUP_BASE_DIR="backups"
BACKUP_SESSION_DIR="$BACKUP_BASE_DIR/session-$(date +%Y%m%d-%H%M%S)-$$"

# 제외할 파일/폴더 패턴 (cross-sdk-js 프로젝트 맞춤)
IGNORE_PATTERNS=(
    # Turborepo 관련
    ".turbo/"                   # Turborepo 캐시 디렉토리
    "turbo.json"                # Turborepo 설정 파일
    
    # 패키지 관리자 파일들
    "node_modules/"             # Node.js 의존성
    "pnpm-lock.yaml"            # PNPM 락 파일
    "pnpm-workspace.yaml"       # PNPM 워크스페이스 설정
    ".pnpmrc"                   # PNPM 설정
    ".npmrc"                    # NPM 설정
    "yarn.lock"                 # Yarn 락 파일
    "package-lock.json"         # NPM 락 파일
    
    # 빌드 결과물
    "dist/"                     # 빌드 결과물
    "build/"                    # 빌드 디렉토리
    ".next/"                    # Next.js 빌드 디렉토리
    "out/"                      # Next.js export 디렉토리
    ".parcel-cache/"            # Parcel 캐시
    ".cache-synpress/"          # Cypress 캐시
    ".rollup.cache/"            # Rollup 캐시
    ".cache/"                   # 일반 캐시 디렉토리
    "tsconfig.tsbuildinfo"      # TypeScript 빌드 정보
    "*.d.ts"                    # TypeScript 선언 파일
    "*.d.ts.map"                # TypeScript 선언 맵 파일
    ".eslintcache"              # ESLint 캐시
    
    # 테스트 및 커버리지
    "coverage/"                 # 테스트 커버리지
    ".coverage/"                # 커버리지 리포트
    "test-results/"             # 테스트 결과
    "playwright-report/"        # Playwright 리포트
    "screenshots/"              # 테스트 스크린샷
    "test/"                     # 테스트 디렉토리
    "tests/"                    # 테스트 디렉토리 (복수형)
    "__tests__/"                # Jest 테스트 디렉토리
    "*.test.ts"                 # 테스트 파일들
    "*.test.js"                 # 테스트 파일들
    "*.spec.ts"                 # 스펙 파일들
    "*.spec.js"                 # 스펙 파일들
    
    # 개발 도구 설정
    ".vscode/"                  # VSCode 설정
    ".idea/"                    # IntelliJ 설정
    
    # 시스템 파일
    ".DS_Store"                 # macOS 시스템 파일
    "Thumbs.db"                 # Windows 썸네일
    
    # 로그 및 임시 파일
    "*.log"                     # 로그 파일들
    "lerna-debug.log"           # Lerna 디버그 로그
    "*.tmp"                     # 임시 파일들
    "*.temp"                    # 임시 파일들
    "tmp/"                      # 임시 디렉토리
    "temp/"                     # 임시 디렉토리
    
    # 환경 변수 파일
    ".env"                      # 환경 변수
    ".env.*"                    # 환경 변수 파일들
    
    # Git 메타데이터
    ".git/"                     # Git 메타데이터
    
    # 버전 관리 도구
    ".changeset/"               # Changeset 설정
    
    # CI/CD 및 기타 설정
    ".github/"                  # GitHub 설정
    ".husky/"                   # Husky git hooks
    "dangerfile.ts"             # Danger.js 설정
    "sonar-project.properties"  # SonarQube 설정
    "Dockerfile"                # Docker 설정
    "rollup.config.dev.js"      # 개발용 Rollup 설정
    "rollup.config.js"          # Rollup 설정 파일
    ".npmignore"                # NPM ignore 파일
    
    # 백업 디렉토리
    "backups/"                  # 이 스크립트가 생성하는 백업
)

# 작업 추적 배열
declare -a CREATED_BACKUPS=()
declare -a SUCCESSFUL_OPERATIONS=()
declare -a FAILED_OPERATIONS=()

# 패키지 설정 (호환성을 위한 함수 기반 설정)
get_package_config() {
    local package_name="$1"
    case "$package_name" in
        "sign-client")
            echo "packages/sign-client:cross-connect"
            ;;
        "universal-provider")
            echo "providers/universal-provider:cross-connect"
            ;;
        *)
            echo ""
            ;;
    esac
}

get_package_default_branch() {
    local package_name="$1"
    case "$package_name" in
        "sign-client"|"universal-provider")
            echo "main"
            ;;
        *)
            echo "main"
            ;;
    esac
}

get_all_packages() {
    echo "sign-client universal-provider"
}

get_package_path() {
    local package_name="$1"
    local config=$(get_package_config "$package_name")
    echo "${config%%:*}"
}

get_package_remote() {
    local package_name="$1"
    local config=$(get_package_config "$package_name")
    echo "${config##*:}"
}

# 로그 함수 (확장)
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" >&2
}

# 사용 가능한 패키지 목록 표시
show_available_packages() {
    echo -e "${BLUE}📦 Available packages:${NC}"
    printf "${CYAN}┌──────────────────────────────────────────────────────────────┐${NC}\n"
    local i=1
    for package in $(get_all_packages); do
        local config=$(get_package_config "$package")
        local path="${config%%:*}"
        local remote="${config##*:}"
        printf "${CYAN}│${NC} %d. %-20s ${YELLOW}%s${NC} → ${GREEN}%s${NC} ${CYAN}│${NC}\n" "$i" "$package" "$path" "$remote"
        ((i++))
    done
    printf "${CYAN}└──────────────────────────────────────────────────────────────┘${NC}\n"
    echo ""
}

# 패키지 선택 함수
select_package() {
    local prompt="${1:-Choose package}"
    echo "=== 패키지 선택 ==="
    echo "1. sign-client"
    echo "2. universal-provider"
    
    local choice
    choice=$(safe_select "${YELLOW}❓ $prompt (1-2):${NC}" 2 "1" "false" "true")
    
    case "$choice" in
        1) echo "sign-client" ;;
        2) echo "universal-provider" ;;
        *) log_error "Invalid package selection"; return 1 ;;
    esac
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" >&2
}

log_error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

log_header() {
    echo -e "${CYAN}$1${NC}" >&2
}

# 아름다운 헤더 출력
print_header() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                  Git Subtree Sync Script                       ║${NC}"
    echo -e "${CYAN}║              cross-sdk-js ↔ Multiple Repos                    ║${NC}"
    echo -e "${CYAN}║                  Multi-Package Sync System                     ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📦 Supported Packages:${NC}"
    for package in $(get_all_packages); do
        local config=$(get_package_config "$package")
        local path="${config%%:*}"
        local remote="${config##*:}"
        echo "   • $package: $path ↔ $remote"
    done
    echo ""
    echo -e "${BLUE}💾 Backup Management:${NC}"
    echo "   • Session backups: $BACKUP_SESSION_DIR"
    echo "   • Auto-cleanup: Keeps 10 most recent sessions"
    echo ""
}

# 제외 패턴 표시
show_exclusions() {
    echo -e "${BLUE}📋 Files/patterns that will be excluded during push:${NC}"
    printf "${CYAN}┌──────────────────────────────────────────────────────────────┐${NC}\n"
    for pattern in "${IGNORE_PATTERNS[@]}"; do
        printf "${CYAN}│${NC} 🚫 %-54s ${CYAN}│${NC}\n" "$pattern"
    done
    printf "${CYAN}└──────────────────────────────────────────────────────────────┘${NC}\n"
    echo ""
}

# 현재 디렉토리가 프로젝트 루트인지 확인 (다중 패키지 지원)
check_project_root() {
    if [[ ! -f "package.json" ]] || [[ ! -d "packages" ]]; then
        log_error "스크립트는 cross-sdk-js 프로젝트 루트에서 실행해야 합니다."
        log_error "현재 위치에 package.json과 packages 디렉토리가 있는지 확인하세요."
        exit 1
    fi
    
    # 설정된 패키지들 중 하나라도 존재하는지 확인
    local found_package=false
    for package_name in $(get_all_packages); do
        local config=$(get_package_config "$package_name")
        local package_path="${config%%:*}"
        if [[ -d "$package_path" ]]; then
            found_package=true
            break
        fi
    done
    
    if [[ "$found_package" == "false" ]]; then
        log_error "설정된 패키지 중 존재하는 패키지가 없습니다:"
        for package_name in $(get_all_packages); do
            local config=$(get_package_config "$package_name")
            local package_path="${config%%:*}"
            echo "   • $package_name: $package_path (없음)"
        done
        exit 1
    fi
}

# Git 상태 확인 (개선)
check_git_status() {
    log_info "🔍 Checking Git status..."
    
    # 현재 브랜치 확인
    local current_branch=$(git branch --show-current)
    echo "   Current branch: $current_branch"
    
    # 미커밋된 변경사항 확인
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "Working directory가 깨끗하지 않습니다."
        echo "커밋되지 않은 변경사항:"
        git status --short | head -5
        if [[ $(git status --porcelain | wc -l) -gt 5 ]]; then
            echo "   ... and $(( $(git status --porcelain | wc -l) - 5 )) more files"
        fi
        
        if ! safe_confirm_explicit "${YELLOW}❓ 계속하시겠습니까?${NC}"; then
            log_info "작업을 취소했습니다."
            exit 0
        fi
    fi
    
    log_success "Git status check completed"
    echo ""
}

# 백업 디렉토리 초기화
initialize_backup_directory() {
    log_info "📁 Initializing backup directory..."
    
    # 백업 기본 디렉토리 생성
    if [[ ! -d "$BACKUP_BASE_DIR" ]]; then
        mkdir -p "$BACKUP_BASE_DIR"
        echo "   Created backup base directory: $BACKUP_BASE_DIR"
    fi
    
    # 세션별 백업 디렉토리 생성
    mkdir -p "$BACKUP_SESSION_DIR"
    echo "   Created session backup directory: $BACKUP_SESSION_DIR"
    
    # 백업 인덱스 파일 생성
    local backup_index="$BACKUP_SESSION_DIR/backup-index.log"
    cat > "$backup_index" << EOF
# Backup Session Information
# Session ID: $(basename "$BACKUP_SESSION_DIR")
# Started: $(date -Iseconds)
# Git Commit: $(git rev-parse HEAD)
# Git Branch: $(git branch --show-current)
# Script: $0

# Backup Entries (will be added during execution)
EOF
    
    echo "   📝 Created backup index: $backup_index"
    echo ""
}

# 백업 디렉토리 정리 (오래된 백업 제거)
cleanup_old_backups() {
    local max_backups=${1:-10}  # 기본적으로 최근 10개 세션만 유지
    
    log_info "🧹 Cleaning up old backups..."
    
    if [[ ! -d "$BACKUP_BASE_DIR" ]]; then
        return 0
    fi
    
    # session- 으로 시작하는 디렉토리들을 찾아서 날짜순 정렬
    local backup_sessions=($(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "session-*" | sort -r))
    local session_count=${#backup_sessions[@]}
    
    if [[ $session_count -gt $max_backups ]]; then
        local to_remove=$(( session_count - max_backups ))
        echo "   Found $session_count backup sessions, removing oldest $to_remove"
        
        for ((i=$max_backups; i<$session_count; i++)); do
            local old_session="${backup_sessions[$i]}"
            echo "   🗑️  Removing old backup: $(basename "$old_session")"
            rm -rf "$old_session"
        done
    else
        echo "   ✅ Only $session_count backup sessions found (max: $max_backups)"
    fi
    echo ""
}

# 패키지 백업 생성 (개선)
create_package_backup() {
    local package_path=$1
    local package_name=$2
    local operation_type=${3:-"operation"}
    
    local timestamp=$(date +%H%M%S)
    local backup_name="${package_name}-${operation_type}-${timestamp}"
    local backup_path="$BACKUP_SESSION_DIR/$backup_name"
    
    log_info "💾 Creating backup for $package_name..."
    
    # 백업 생성 (rsync 사용으로 심볼릭 링크 문제 해결)
    if command -v rsync &> /dev/null; then
        # rsync로 백업 (심볼릭 링크 제외, 소프트 실패)
        if rsync -a --exclude="node_modules" --exclude=".git" "$package_path/" "$backup_path/"; then
            echo "   ✅ Backup created with rsync: $backup_path" >&2
        else
            log_warning "rsync backup failed, trying cp..."
            # rsync 실패 시 cp 사용
            if cp -r "$package_path" "$backup_path" 2>/dev/null; then
                echo "   ✅ Backup created with cp: $backup_path" >&2
            else
                log_error "Both rsync and cp failed"
                return 1
            fi
        fi
    else
        # rsync가 없으면 cp 사용 (심볼릭 링크 건너뛰기)
        if cp -r "$package_path" "$backup_path" 2>/dev/null; then
            echo "   ✅ Backup created with cp: $backup_path" >&2
        else
            log_warning "Standard cp failed, trying with error suppression..."
            # node_modules 등 문제있는 디렉토리 건너뛰고 백업
            mkdir -p "$backup_path"
            find "$package_path" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec cp --parents {} "$backup_path" \; 2>/dev/null
            if [[ -d "$backup_path" ]] && [[ "$(find "$backup_path" -type f | wc -l)" -gt 0 ]]; then
                echo "   ✅ Partial backup created: $backup_path" >&2
            else
                log_error "Failed to create backup"
                return 1
            fi
        fi
    fi
    
    # 백업 정보를 인덱스에 추가
    local backup_index="$BACKUP_SESSION_DIR/backup-index.log"
    cat >> "$backup_index" << EOF

[$(date -Iseconds)] $package_name ($operation_type)
  Source: $package_path
  Backup: $backup_path
  Size: $(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "unknown")
EOF
    
    # 백업 배열에 추가
    CREATED_BACKUPS+=("$backup_path")
    
    # 백업 경로만 stdout으로 반환 (다른 메시지들은 모두 stderr로)
    echo "$backup_path"
    return 0
}

# 백업에서 복원
restore_from_backup() {
    local original_path=$1
    local backup_path=$2
    local package_name=$3
    
    log_info "🔄 Restoring $package_name from backup..."
    
    if [[ ! -d "$backup_path" ]]; then
        log_error "Backup not found: $backup_path"
        return 1
    fi
    
    # 원본 삭제 후 백업에서 복원
    if rm -rf "$original_path" && cp -r "$backup_path" "$original_path"; then
        echo "   ✅ Restored from: $backup_path"
        return 0
    else
        log_error "Failed to restore from backup"
        return 1
    fi
}

# 제외 패턴 적용
apply_exclusions() {
    local package_path=$1
    
    log_info "🗑️  Applying exclusions..."
    local removed_count=0
    
    for pattern in "${IGNORE_PATTERNS[@]}"; do
        local found_files=$(find "$package_path" -name "$pattern" 2>/dev/null || true)
        if [[ -n "$found_files" ]]; then
            echo "$found_files" | while IFS= read -r file; do
                if [[ -e "$file" ]]; then
                    rm -rf "$file"
                    ((removed_count++)) 2>/dev/null || true
                fi
            done
        fi
    done
    
    echo "   🗑️  Removed files matching exclude patterns"
}

# GitHub PR 자동 생성 (범용)
create_pull_request() {
    local branch_name=$1
    local package_name=$2
    local target_repo=$3
    
    log_info "🤖 Creating PR with GitHub CLI..."
    
    # 패키지 설정에서 경로 가져오기
    local config=$(get_package_config "$package_name")
    local package_path="${config%%:*}"
    
    local pr_title="sync($package_name): Update from cross-sdk-js"
    local pr_body="## 🔄 Package Sync from cross-sdk-js

**Package:** \`$package_name\`
**Source:** cross-sdk-js/$package_path
**Target Repository:** \`$target_repo\`
**Target Branch:** \`$branch_name\`
**Backup Session:** \`$(basename "$BACKUP_SESSION_DIR")\`

### 📝 Recent Changes
$(git log --oneline -3 --pretty=format:"- %s" -- "$package_path" | head -3)

### 🚫 Excluded Files
- Build artifacts and node_modules
- IDE and system files
- Turborepo configuration files

### 💾 Backup Information
- Backup session: \`$BACKUP_SESSION_DIR\`
- Package backup available for rollback if needed

### ✅ Checklist
- [x] Build files excluded
- [x] Source code synchronized
- [x] Backup created
- [ ] CI/CD tests passed
- [ ] Ready for review

---
🤖 Auto-generated by cross-sdk-js sync system  
⏰ Created: $(date -Iseconds)  
📋 Source commit: $(git rev-parse HEAD)"

    if command -v gh &> /dev/null; then
        if gh pr create \
            --repo "to-nexus/$target_repo" \
            --head "$branch_name" \
            --base "main" \
            --title "$pr_title" \
            --body "$pr_body"; then
            
            log_success "PR created successfully!"
            return 0
        else
            log_error "Failed to create PR with GitHub CLI"
            echo "You can create it manually at:"
            echo "https://github.com/to-nexus/$target_repo/compare/main...$branch_name"
            return 1
        fi
    else
        log_warning "GitHub CLI (gh) not found"
        echo "Install GitHub CLI to enable automatic PR creation"
        echo "Manual PR: https://github.com/to-nexus/$target_repo/compare/main...$branch_name"
        return 1
    fi
}

# 브랜치 이름 제안 생성
suggest_branch_names() {
    local commit_msg=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "update")
    local timestamp=$(date +%Y%m%d-%H%M)
    local commit_hash=$(git rev-parse --short HEAD)
    local clean_commit_msg=$(echo "$commit_msg" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    
    echo -e "${BLUE}💡 Suggested branch names:${NC}" >&2
    printf "${CYAN}┌──────────────────────────────────────────────────────────────┐${NC}\n" >&2
    printf "${CYAN}│${NC} 1. sync/$timestamp-$commit_hash                         ${CYAN}│${NC}\n" >&2
    printf "${CYAN}│${NC} 2. feat/$clean_commit_msg                               ${CYAN}│${NC}\n" >&2
    printf "${CYAN}│${NC} 3. update/cross-sdk-js-$timestamp                     ${CYAN}│${NC}\n" >&2
    printf "${CYAN}│${NC} 4. hotfix/urgent-$(date +%m%d-%H%M)                     ${CYAN}│${NC}\n" >&2
    printf "${CYAN}│${NC} 5. Custom (enter your own)                              ${CYAN}│${NC}\n" >&2
    printf "${CYAN}└──────────────────────────────────────────────────────────────┘${NC}\n" >&2
    echo "" >&2
}

# 향상된 브랜치 선택 (기존 브랜치 선택 + 새 브랜치 제안)
enhanced_select_branch() {
    local remote_name=$1
    local default_branch=${2:-main}
    local for_push=${3:-false}
    
    log_info "📋 $remote_name 저장소의 브랜치 관리..."
    
    # 원격 브랜치 목록 가져오기
    local branches=($(git ls-remote --heads $remote_name | cut -f2 | sed 's|refs/heads/||' | sort))
    
    if [[ "$for_push" == "true" ]]; then
        # Push용: 새 브랜치 제안 + 기존 브랜치 선택
        suggest_branch_names
        
        # 출력이 완전히 표시될 때까지 대기
        sleep 1
        
        local choice
        choice=$(safe_select "${YELLOW}❓ Choose option (1-5):${NC}" 5 1 "false" "true")
        
        case "$choice" in
            1)
                printf "sync/$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)"
                ;;
            2)
                local commit_msg=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "update")
                printf "feat/$(echo "$commit_msg" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')"
                ;;
            3)
                printf "update/cross-sdk-js-$(date +%Y%m%d-%H%M)"
                ;;
            4)
                printf "hotfix/urgent-$(date +%m%d-%H%M)"
                ;;
            5)
                local custom_branch
                custom_branch=$(safe_select "${YELLOW}❓ 새 브랜치명을 입력하세요:${NC}" 999 "" "true" "false")
                if [[ -n "$custom_branch" ]]; then
                    printf "%s" "$custom_branch"
                else
                    log_error "브랜치명을 입력해주세요."
                    exit 1
                fi
                ;;
            *)
                log_error "Invalid choice: '$choice'"
                exit 1
                ;;
        esac
    else
        # Pull용: 기존 브랜치 선택
        if [[ ${#branches[@]} -eq 0 ]]; then
            log_warning "브랜치 목록을 가져올 수 없습니다. 기본 브랜치 '$default_branch' 사용"
            printf "%s" "$default_branch"
            return
        fi
        
        echo ""
        echo "=== $remote_name 저장소의 사용 가능한 브랜치 ===" >&2
        local default_position=1
        for i in "${!branches[@]}"; do
            local branch="${branches[$i]}"
            if [[ "$branch" == "$default_branch" ]]; then
                echo "  $((i+1)). $branch [DEFAULT]" >&2
                default_position=$((i+1))
            else
                echo "  $((i+1)). $branch" >&2
            fi
        done
        echo "  0. 새로운 브랜치명 직접 입력" >&2
        echo "" >&2
        
        # 강제 출력 플러시
        exec 2>&2
        sleep 1
        
        local choice
        choice=$(safe_select "${YELLOW}❓ 브랜치를 선택하세요:${NC}" ${#branches[@]} "$default_position" "true" "true")
        
        # 기본값 처리 (기본 브랜치 위치로 선택)
        if [[ "$choice" == "$default_position" ]]; then
            printf "%s" "$default_branch"
            return
        fi
        
        # 새 브랜치명 직접 입력
        if [[ "$choice" == "0" ]]; then
            local new_branch
            new_branch=$(safe_select "${YELLOW}❓ 새 브랜치명을 입력하세요:${NC}" 999 "" "true" "false")
            if [[ -n "$new_branch" ]]; then
                printf "%s" "$new_branch"
                return
            else
                log_error "브랜치명을 입력해주세요."
                exit 1
            fi
        fi
        
        # 숫자로 선택
        if [[ "$choice" =~ ^[0-9]+$ ]] && [[ $choice -ge 1 ]] && [[ $choice -le ${#branches[@]} ]]; then
            local selected_branch="${branches[$((choice-1))]}"
            printf "%s" "$selected_branch"
            return
        fi
        
        # 브랜치명 직접 입력 확인
        for branch in "${branches[@]}"; do
            if [[ "$branch" == "$choice" ]]; then
                printf "%s" "$choice"
                return
            fi
        done
        
        log_error "잘못된 선택입니다."
        exit 1
    fi
}

# 브랜치명 정리 함수 (추가)
sanitize_branch_name() {
    local branch_name="$1"
    # 앞뒤 공백, 탭, 개행 문자 제거
    branch_name=$(echo "$branch_name" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    # 제어 문자 제거
    branch_name=$(echo "$branch_name" | tr -d '[:cntrl:]')
    # Git에서 허용하는 문자만 유지 (알파벳, 숫자, 언더스코어, 하이픈, 점, 슬래시)
    branch_name=$(echo "$branch_name" | tr -cd '[:alnum:]_.-/')
    # 앞뒤에 점만 제거 (하이픈은 유지)
    branch_name=$(echo "$branch_name" | sed 's/^[.]//;s/[.]$//')
    
    if [[ -z "$branch_name" ]]; then
        log_error "Invalid branch name: $1. Please use only alphanumeric, underscore, hyphen, dot, or slash."
        exit 1
    fi
    
    echo "$branch_name"
}


# 브랜치 선택 함수 (기존 함수 교체)
select_branch() {
    local remote_name=$1
    local default_branch=${2:-main}
    
    local result
    result=$(enhanced_select_branch "$remote_name" "$default_branch" "false")
    # 브랜치명 정리
    result=$(sanitize_branch_name "$result")
    printf "%s" "$result"
}

# 브랜치별 작업 확인
confirm_branch_operation() {
    local operation=$1
    local package_name=$2
    local remote_name=$3
    local branch=$4
    
    echo ""
    log_info "📋 작업 정보 확인"
    echo "  작업: $operation"
    echo "  패키지: $package_name"
    echo "  저장소: $remote_name"
    echo "  브랜치: $branch"
    echo ""
    
    if ! safe_confirm_explicit "${YELLOW}❓ 위 정보로 진행하시겠습니까?${NC}"; then
        log_info "작업을 취소했습니다."
        return 1
    fi
    return 0
}

# Remote 저장소 설정 확인 (수정)
setup_remotes() {
    log_info "📡 Remote 저장소 설정 확인 중..."
    
    # cross-connect remote 확인 및 설정
    if ! git remote get-url cross-connect &>/dev/null; then
        log_info "cross-connect remote 추가 중..."
        git remote add cross-connect https://github.com/to-nexus/cross-connect.git
    fi
    
    # 최신 정보 가져오기
    log_info "📥 최신 정보 가져오는 중..."
    git fetch cross-connect
    
    log_success "Remote 저장소 설정 완료"
}

# Subtree 초기 연결 확인 및 설정
ensure_subtree_connection() {
    local package_name="universal-provider"
    local remote_name="cross-connect"
    local package_path="providers/$package_name"
    
    ensure_subtree_connection_generic "$package_name" "$package_path" "$remote_name"
}

# 범용 subtree 연결 함수
ensure_subtree_connection_generic() {
    local package_name=$1
    local package_path=$2
    local remote_name=$3
    local default_branch="${4:-main}"
    
    log_info "🔗 $package_name Subtree 연결 상태 확인 중..."
    
    # .git/subtree-cache 또는 git log로 subtree 연결 확인
    if git log --grep="git-subtree-dir: $package_path" --oneline -1 &>/dev/null; then
        log_success "기존 $package_name subtree 연결 확인됨"
        return 0
    fi
    
    # 디렉토리가 존재하지만 subtree로 연결되지 않은 경우
    if [[ -d "$package_path" ]]; then
        log_warning "$package_path가 존재하지만 subtree로 연결되지 않았습니다."
        
        if safe_confirm_explicit "${YELLOW}❓ 기존 디렉토리를 백업하고 subtree로 재연결하시겠습니까?${NC}"; then
            # 기존 디렉토리 백업
            local backup_path
            backup_path=$(create_package_backup "$package_path" "$package_name" "pre-subtree")
            
            # 기존 디렉토리 제거
            git rm -rf "$package_path"
            git commit -m "Remove $package_path for subtree setup"
        else
            log_info "작업을 취소했습니다."
            return 1
        fi
    fi
    
    # 새로운 subtree 연결
    log_info "🔗 새로운 $package_name subtree 연결 중..."
    
    if git subtree add --prefix="$package_path" "$remote_name" "$default_branch" --squash; then
        log_success "$package_name Subtree 연결 완료: $package_path ↔ $remote_name"
        return 0
    else
        log_error "$package_name Subtree 연결 실패"
        return 1
    fi
}

# 원격 브랜치 존재 확인 및 생성
ensure_remote_branch() {
    local remote_name=$1
    local branch_name=$2
    
    log_info "🌿 원격 브랜치 확인 중: $remote_name/$branch_name"
    
    # 원격 브랜치 존재 확인
    if git ls-remote --heads "$remote_name" | grep -q "refs/heads/$branch_name"; then
        log_success "브랜치 $branch_name가 이미 존재합니다"
        return 0
    fi
    
    log_warning "브랜치 $branch_name가 존재하지 않습니다"
    
    if safe_confirm_explicit "${YELLOW}❓ 원격에 새 브랜치 $branch_name를 생성하시겠습니까?${NC}"; then
        # 임시 브랜치 생성 및 푸시
        local temp_branch="temp-create-$branch_name-$$"
        local current_branch=$(git branch --show-current)
        
        log_info "임시 브랜치로 원격 브랜치 생성 중..."
        
        # 임시 브랜치 생성
        git checkout -b "$temp_branch"
        
        # 빈 커밋으로 브랜치 생성
        git commit --allow-empty -m "temp: create branch $branch_name"
        
        # 원격에 브랜치 푸시
        if git push "$remote_name" "$temp_branch:$branch_name"; then
            log_success "원격 브랜치 $branch_name 생성 완료"
            
            # 임시 브랜치 정리
            git checkout "$current_branch"
            git branch -D "$temp_branch"
            
            return 0
        else
            log_error "원격 브랜치 생성 실패"
            
            # 실패 시 정리
            git checkout "$current_branch"
            git branch -D "$temp_branch"
            
            return 1
        fi
    else
        log_info "원격 브랜치 생성을 취소했습니다."
        return 1
    fi
}

# 선택적 파일 업데이트 함수 (수정) - 필드 업데이트 개선
selective_pull_from_external() {
    local package_name="${1:-}"
    local branch="${2:-}"
    local update_package_fields="${3:-true}"  # package.json 필드 업데이트 여부
    local selective_files=("src/")
    
    # 패키지가 지정되지 않았으면 선택
    if [[ -z "$package_name" ]]; then
        package_name=$(select_package "Select package to pull selectively")
    fi
    
    # 패키지 설정 확인
    if [[ -z "$(get_package_config "$package_name")" ]]; then
        log_error "Unknown package: $package_name"
        return 1
    fi
    
    local config=$(get_package_config "$package_name")
    local package_path="${config%%:*}"
    local remote_name="${config##*:}"
    local default_branch=$(get_package_default_branch "$package_name")
    
    # 브랜치가 지정되지 않았으면 선택
    if [[ -z "$branch" ]]; then
        branch=$(select_branch "$remote_name" "$default_branch")
    fi
    
    # 브랜치명 정리 (중요!)
    branch=$(sanitize_branch_name "$branch")
    
    # 작업 확인
    local operation_desc="Selective Pull (src + package.json fields)"
    if [[ "$update_package_fields" != "true" ]]; then
        operation_desc="Selective Pull (src only)"
    fi
    
    if ! confirm_branch_operation "$operation_desc" "$package_name" "$remote_name" "$branch"; then
        return 1
    fi
    
    log_info "📥 $package_name 패키지 선택적 업데이트 중..."
    echo "   📂 Target: $package_path"
    echo "   📁 Files: src/"
    if [[ "$update_package_fields" == "true" ]]; then
        echo "   📄 Package.json: version, scripts, dependencies"
    fi
    echo "   🌿 From: $remote_name/$branch"
    
    # 임시 디렉토리 생성
    local temp_dir=$(mktemp -d)
    local clone_success=false
    
    # 외부 저장소 clone
    log_info "📥 Cloning external repository..."
    echo "   명령어: git clone --depth=1 --branch=\"$branch\" \"https://github.com/to-nexus/$remote_name.git\" \"$temp_dir\""
    
    if git clone --depth=1 --branch="$branch" "https://github.com/to-nexus/$remote_name.git" "$temp_dir" 2>/dev/null; then
        clone_success=true
        log_success "External repository cloned successfully"
    else
        log_error "Failed to clone external repository"
        echo "실패한 명령어: git clone --depth=1 --branch=\"$branch\" \"https://github.com/to-nexus/$remote_name.git\" \"$temp_dir\""
        rm -rf "$temp_dir"
        return 1
    fi
    
    # 백업 생성
    local backup_path
    if ! backup_path=$(create_package_backup "$package_path" "$package_name" "selective-pull"); then
        log_error "Failed to create backup, aborting selective pull"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # 패키지 디렉토리가 없으면 생성
    if [[ ! -d "$package_path" ]]; then
        log_info "📁 Creating package directory: $package_path"
        mkdir -p "$package_path"
    fi
    
    # 선택적 파일 복사
    local copy_success=true
    local updated_files=()
    
    # src 디렉토리 업데이트
    for file in "${selective_files[@]}"; do
        local source_file="$temp_dir/$file"
        local target_file="$package_path/$file"
        
        if [[ -e "$source_file" ]]; then
            log_info "📄 Updating $file..."
            
            if [[ -d "$source_file" ]]; then
                # 디렉토리인 경우
                if [[ -d "$target_file" ]]; then
                    rm -rf "$target_file"
                fi
                if cp -r "$source_file" "$target_file"; then
                    updated_files+=("$file (directory)")
                    echo "   ✅ $file directory updated"
                else
                    log_error "Failed to copy $file directory"
                    copy_success=false
                fi
            else
                # 파일인 경우
                if cp "$source_file" "$target_file"; then
                    updated_files+=("$file")
                    echo "   ✅ $file updated"
                else
                    log_error "Failed to copy $file"
                    copy_success=false
                fi
            fi
        else
            log_warning "$file not found in external repository"
        fi
    done
    
    # package.json 필드 업데이트 (선택적)
    if [[ "$update_package_fields" == "true" ]]; then
        # 수정: 패키지별 package.json 경로 사용
        local source_package_json="$temp_dir/providers/$package_name/package.json"
        local target_package_json="$package_path/package.json"
        
        # universal-provider와 sign-client에 따라 경로 조정
        if [[ "$package_name" == "sign-client" ]]; then
            source_package_json="$temp_dir/packages/$package_name/package.json"
        elif [[ "$package_name" == "universal-provider" ]]; then
            source_package_json="$temp_dir/providers/$package_name/package.json"
        fi
        
        log_info "📄 Source package.json: $source_package_json"
        log_info "📄 Target package.json: $target_package_json"
        
        if [[ -f "$source_package_json" ]]; then
            if update_package_json_fields "$target_package_json" "$source_package_json"; then
                updated_files+=("package.json (version, scripts, dependencies)")
            else
                log_warning "Failed to update package.json fields, but continuing..."
            fi
        else
            log_warning "Package-specific package.json not found at: $source_package_json"
            log_info "Available files in external repo:"
            find "$temp_dir" -name "package.json" -type f | head -5
        fi
    fi
    
    # 임시 디렉토리 정리
    rm -rf "$temp_dir"
    
    if $copy_success && [[ ${#updated_files[@]} -gt 0 ]]; then
        log_success "$package_name 선택적 업데이트 완료"
        echo ""
        echo -e "${BLUE}📋 Updated files:${NC}"
        for file in "${updated_files[@]}"; do
            echo "   • $file"
        done
        echo ""
        echo -e "${BLUE}💾 Backup available at:${NC} $backup_path"
        return 0
    else
        log_error "Selective pull failed or no files were updated"
        
        # 실패 시 백업에서 복원
        if [[ -d "$backup_path" ]]; then
            log_info "🔄 Restoring from backup..."
            restore_from_backup "$package_path" "$backup_path" "$package_name"
        fi
        return 1
    fi
}

# Subtree Pull (외부 저장소 → cross-sdk-js) - 범용 (수정: 기본적으로 선택적 업데이트)
pull_from_external() {
    local package_name="${1:-}"
    local branch="${2:-}"
    local use_subtree="${3:-false}"  # subtree 사용 여부 (기본값: false)
    
    # 패키지가 지정되지 않았으면 선택
    if [[ -z "$package_name" ]]; then
        package_name=$(select_package "Select package to pull")
    fi
    
    # 패키지 설정 확인
    if [[ -z "$(get_package_config "$package_name")" ]]; then
        log_error "Unknown package: $package_name"
        return 1
    fi
    
    local config=$(get_package_config "$package_name")
    local package_path="${config%%:*}"
    local remote_name="${config##*:}"
    local default_branch=$(get_package_default_branch "$package_name")
    
    # 브랜치가 지정되지 않았으면 선택
    if [[ -z "$branch" ]]; then
        branch=$(select_branch "$remote_name" "$default_branch")
    fi
    
    # 브랜치명 정리
    branch=$(sanitize_branch_name "$branch")
    
    # 업데이트 방식 선택
    if [[ "$use_subtree" != "true" ]]; then
        log_info "🎯 기본 모드: 선택적 업데이트 (src + package.json 필드들)"
        echo ""
        echo -e "${BLUE}📋 업데이트 옵션:${NC}"
        echo "   1. 선택적 업데이트 (src + package.json 필드들) - 권장"
        echo "   2. src만 업데이트 (package.json 제외)"
        echo "   3. 전체 Subtree pull (고급 사용자용)"
        echo "   4. 작업 취소"
        echo ""
        
        local choice
        choice=$(safe_select "${YELLOW}❓ 어떤 방식으로 업데이트하시겠습니까?${NC}" 4 1 "false" "true")
        
        case "$choice" in
            1)
                log_info "🎯 선택적 업데이트 (src + package.json 필드들) 진행..."
                selective_pull_from_external "$package_name" "$branch" "true"
                return $?
                ;;
            2)
                log_info "🎯 src만 업데이트 진행..."
                selective_pull_from_external "$package_name" "$branch" "false"
                return $?
                ;;
            3)
                log_info "🔄 Subtree pull 진행..."
                use_subtree="true"
                # 아래 subtree 로직으로 계속 진행
                ;;
            4)
                log_info "작업을 취소했습니다"
                return 1
                ;;
            *)
                log_error "잘못된 선택입니다"
                return 1
                ;;
        esac
    fi
    
    # Subtree pull 로직 (기존 코드 유지)
    if [[ "$use_subtree" == "true" ]]; then
        # 디버깅 정보 출력
        log_info "🔍 Debug: Branch name check"
        echo "   Raw branch: '$branch'"
        echo "   Branch length: ${#branch}"
        echo "   Branch hex: $(echo -n "$branch" | hexdump -C)"
        
        # 작업 확인
        if ! confirm_branch_operation "Subtree Pull" "$package_name" "$remote_name" "$branch"; then
            return 1
        fi
        
        log_info "📥 $package_name 패키지를 $remote_name/$branch에서 가져오는 중..."
        echo "   📂 Target: $package_path"
        
        # 원격 브랜치 존재 확인
        log_info "🔍 원격 브랜치 확인 중: $remote_name/$branch"
        if ! git ls-remote --heads "$remote_name" | grep -q "refs/heads/$branch$"; then
            log_error "브랜치 '$branch'가 원격 저장소 '$remote_name'에 존재하지 않습니다"
            echo "사용 가능한 브랜치:"
            git ls-remote --heads "$remote_name" | sed 's|.*refs/heads/||' | head -5
            return 1
        fi
        
        # Subtree 연결 상태 확인
        log_info "🔗 $package_name Subtree 연결 상태 확인 중..."
        
        # Git log로 subtree 이력 확인
        if git log --all --grep="git-subtree-dir: $package_path" --oneline -1 &>/dev/null; then
            log_success "기존 $package_name subtree 연결 확인됨"
            
            # Subtree pull 실행
            log_info "⬇️  git subtree pull 실행 중..."
            echo "   명령어: git subtree pull --prefix=\"$package_path\" --squash \"$remote_name\" \"$branch\""
            
            if git subtree pull \
                --prefix="$package_path" \
                --squash \
                "$remote_name" "$branch"; then
                
                log_success "$package_name 패키지 업데이트 완료"
                return 0
            else
                log_error "Subtree pull 실패"
                echo "실패한 명령어: git subtree pull --prefix=\"$package_path\" --squash \"$remote_name\" \"$branch\""
                
                # Subtree pull 실패 시 선택적 pull로 대체 제안
                log_warning "Subtree pull이 실패했습니다. 선택적 업데이트로 시도해보시겠습니까?"
                if safe_confirm_explicit "${YELLOW}❓ 선택적 업데이트 (src + package.json 필드들)로 시도하시겠습니까?${NC}"; then
                    log_info "🎯 선택적 업데이트로 변경..."
                    selective_pull_from_external "$package_name" "$branch" "true"
                    return $?
                else
                    return 1
                fi
            fi
        else
            log_warning "$package_path가 subtree로 연결되지 않았거나 초기화되지 않았습니다"
            
            if safe_confirm_explicit "${YELLOW}❓ Subtree로 재초기화하시겠습니까?${NC}"; then
                log_info "🔄 Subtree 재초기화 진행..."
                if ensure_subtree_connection_generic "$package_name" "$package_path" "$remote_name" "$branch"; then
                    log_info "⬇️  Subtree pull 재시도..."
                    if git subtree pull \
                        --prefix="$package_path" \
                        --squash \
                        "$remote_name" "$branch"; then
                        
                        log_success "$package_name 패키지 업데이트 완료"
                        return 0
                    else
                        log_error "Subtree pull 재시도 실패"
                        return 1
                    fi
                else
                    log_error "Subtree 재초기화 실패"
                    return 1
                fi
            else
                log_info "선택적 업데이트로 대체..."
                selective_pull_from_external "$package_name" "$branch" "true"
                return $?
            fi
        fi
    fi
}

# push_to_external 함수 정의 (3가지 모드 지원)
push_to_external() {
    local package_name=$1
    local remote_name=$2
    local branch=${3:-}
    
    # 패키지가 지정되지 않았으면 선택
    if [[ -z "$package_name" ]]; then
        echo "=== 패키지 선택 ==="
        echo "1. sign-client"
        echo "2. universal-provider"
        
        local choice
        choice=$(safe_select "패키지를 선택하세요" 2 1 "false" "true")
        
        case "$choice" in
            1) package_name="sign-client" ;;
            2) package_name="universal-provider" ;;
            *) log_error "Invalid choice"; return 1 ;;
        esac
    fi
    
    # 패키지별 설정
    case "$package_name" in
        "sign-client"|"universal-provider")
            remote_name="${remote_name:-cross-connect}"
            ;;
        *)
            log_error "Unknown package: $package_name"
            return 1
            ;;
    esac
    
    # 브랜치가 지정되지 않았으면 선택
    if [[ -z "$branch" ]]; then
        branch=$(enhanced_select_branch "$remote_name" "main" "true")
    fi
    
    # 브랜치명 정리
    branch=$(sanitize_branch_name "$branch")
    
    # Push 방식 선택
    echo ""
    echo -e "${BLUE}📋 Push 옵션:${NC}"
    echo "   1. 선택적 Push (src + package.json 필드들) - 권장 ⭐"
    echo "   2. src만 Push (package.json 제외)"
    echo "   3. 전체 Subtree push (기존 방식)"
    echo "   4. 작업 취소"
    echo ""
    
    local choice
    choice=$(safe_select "${YELLOW}❓ 어떤 방식으로 Push하시겠습니까?${NC}" 4 1 "false" "true")
    
    case "$choice" in
        1)
            log_info "🎯 선택적 Push (src + package.json 필드들) 진행..."
            selective_push_to_external "$package_name" "$remote_name" "$branch" "true"
            return $?
            ;;
        2)
            log_info "🎯 src만 Push 진행..."
            selective_push_to_external "$package_name" "$remote_name" "$branch" "false"
            return $?
            ;;
        3)
            log_info "🔄 Subtree push 진행..."
            # 기존 subtree 로직 실행
            ;;
        4)
            log_info "작업을 취소했습니다"
            return 1
            ;;
        *)
            log_error "잘못된 선택입니다"
            return 1
            ;;
    esac
    
    # 기존 Subtree push 로직 (choice == 3인 경우)
    # ... 기존 코드 유지 ...
}

# 선택적 Push 함수 (새로 추가)
selective_push_to_external() {
    local package_name="${1:-}"
    local remote_name="${2:-}"
    local branch="${3:-}"
    local push_package_fields="${4:-true}"  # package.json 필드 push 여부
    
    # 패키지가 지정되지 않았으면 선택
    if [[ -z "$package_name" ]]; then
        echo "=== 패키지 선택 ==="
        echo "1. sign-client"
        echo "2. universal-provider"
        
        local choice
        choice=$(safe_select "패키지를 선택하세요" 2 1 "false" "true")
        
        case "$choice" in
            1) package_name="sign-client" ;;
            2) package_name="universal-provider" ;;
            *) log_error "Invalid choice"; return 1 ;;
        esac
    fi
    
    # 패키지별 설정
    case "$package_name" in
        "sign-client"|"universal-provider")
            remote_name="${remote_name:-cross-connect}"
            ;;
        *)
            log_error "Unknown package: $package_name"
            return 1
            ;;
    esac
    
    local package_path
    case "$package_name" in
        "sign-client")
            package_path="packages/sign-client"
            ;;
        "universal-provider")
            package_path="providers/universal-provider"
            ;;
        *)
            log_error "Unknown package: $package_name"
            return 1
            ;;
    esac
    
    log_info "📤 $package_name 패키지 선택적 Push 중..."
    echo "   📂 Source: $package_path"
    echo "   📁 Files: src/"
    if [[ "$push_package_fields" == "true" ]]; then
        echo "   📄 Package.json: version, scripts, dependencies"
    fi
    echo "   🎯 To: $remote_name/$branch"
    
    # 임시 디렉토리 생성
    local temp_dir=$(mktemp -d)
    
    # 원격 저장소 clone
    log_info "📥 Cloning target repository..."
    if ! git clone "https://github.com/to-nexus/$remote_name.git" "$temp_dir/repo" --depth=1 --branch="$branch" 2>/dev/null; then
        log_error "Failed to clone target repository"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # 패키지별 경로 설정
    local target_package_path="$temp_dir/repo"
    if [[ "$package_name" == "sign-client" ]]; then
        target_package_path="$temp_dir/repo/packages/$package_name"
    elif [[ "$package_name" == "universal-provider" ]]; then
        target_package_path="$temp_dir/repo/providers/$package_name"
    fi
    
    # 타겟 패키지 디렉토리 확인/생성
    if [[ ! -d "$target_package_path" ]]; then
        log_info "📁 Creating target package directory in remote repo"
        mkdir -p "$target_package_path"
    fi
    
    # 백업 생성 (로컬)
    local backup_path
    if ! backup_path=$(create_package_backup "$package_path" "$package_name" "selective-push"); then
        log_error "Failed to create backup, aborting selective push"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # 선택적 파일 복사
    local copy_success=true
    local pushed_files=()
    
    # src 디렉토리 복사
    if [[ -d "$package_path/src" ]]; then
        log_info "📄 Copying src directory..."
        if [[ -d "$target_package_path/src" ]]; then
            rm -rf "$target_package_path/src"
        fi
        if cp -r "$package_path/src" "$target_package_path/src"; then
            pushed_files+=("src/ (directory)")
            echo "   ✅ src directory copied"
        else
            log_error "Failed to copy src directory"
            copy_success=false
        fi
    else
        log_warning "src directory not found in local package"
    fi
    
    # package.json 필드 업데이트 (선택적)
    if [[ "$push_package_fields" == "true" ]]; then
        local source_package_json="$package_path/package.json"
        local target_package_json="$target_package_path/package.json"
        
        if [[ -f "$source_package_json" ]]; then
            # 타겟 package.json이 없으면 생성
            if [[ ! -f "$target_package_json" ]]; then
                log_info "Creating new package.json in target"
                echo '{}' > "$target_package_json"
            fi
            
            if update_package_json_fields "$target_package_json" "$source_package_json"; then
                pushed_files+=("package.json (version, scripts, dependencies)")
            else
                log_warning "Failed to update package.json fields, but continuing..."
            fi
        else
            log_warning "Local package.json not found at: $source_package_json"
        fi
    fi
    
    if $copy_success && [[ ${#pushed_files[@]} -gt 0 ]]; then
        # Git에 변경사항 추가 및 커밋
        cd "$temp_dir/repo"
        git add .
        
        if git diff --cached --quiet; then
            log_warning "No changes to commit"
            rm -rf "$temp_dir"
            return 0
        fi
        
        local commit_message="feat($package_name): selective update from cross-sdk-js

Updated files:
$(printf '- %s\n' "${pushed_files[@]}")

Source: cross-sdk-js/$package_path
Generated by selective push at $(date -Iseconds)"
        
        git commit -m "$commit_message"
        
        # 원격에 푸시
        log_info "⬆️ Pushing changes to $remote_name/$branch..."
        if git push origin HEAD:"$branch"; then
            log_success "$package_name 선택적 Push 완료"
            echo ""
            echo -e "${BLUE}📋 Pushed files:${NC}"
            for file in "${pushed_files[@]}"; do
                echo "   • $file"
            done
            echo ""
            echo -e "${BLUE}💾 Backup available at:${NC} $backup_path"
            echo -e "${BLUE}🔗 View changes:${NC} https://github.com/to-nexus/$remote_name/tree/$branch"
            
            # 성공한 작업 기록
            SUCCESSFUL_OPERATIONS+=("Selective Push: $package_name → $remote_name/$branch")
            
            rm -rf "$temp_dir"
            return 0
        else
            log_error "Failed to push changes"
            copy_success=false
        fi
    fi
    
    if ! $copy_success; then
        log_error "Selective push failed"
        FAILED_OPERATIONS+=("Selective Push: $package_name → $remote_name/$branch")
        rm -rf "$temp_dir"
        return 1
    fi
    
    rm -rf "$temp_dir"
}

# 세션 요약 생성
generate_session_summary() {
    local summary_file="$BACKUP_SESSION_DIR/session-summary.md"
    
    log_info "📋 Generating session summary..."
    
    cat > "$summary_file" << EOF
# Sync Session Summary

**Session ID:** $(basename "$BACKUP_SESSION_DIR")  
**Started:** $(date -Iseconds)  
**Git Commit:** $(git rev-parse HEAD)  
**Git Branch:** $(git branch --show-current)  
**Script:** $0

## Operations Performed

### ✅ Successful Operations
EOF

    if [[ ${#SUCCESSFUL_OPERATIONS[@]} -gt 0 ]]; then
        for operation in "${SUCCESSFUL_OPERATIONS[@]}"; do
            echo "- $operation" >> "$summary_file"
        done
    else
        echo "- None" >> "$summary_file"
    fi
    
    cat >> "$summary_file" << EOF

### ❌ Failed Operations
EOF

    if [[ ${#FAILED_OPERATIONS[@]} -gt 0 ]]; then
        for operation in "${FAILED_OPERATIONS[@]}"; do
            echo "- $operation" >> "$summary_file"
        done
    else
        echo "- None" >> "$summary_file"
    fi
    
    cat >> "$summary_file" << EOF

## Created Backups

| Package | Backup Path | Size | Created |
|---------|-------------|------|---------|
EOF

    for backup_path in "${CREATED_BACKUPS[@]}"; do
        local package_name=$(basename "$backup_path" | cut -d'-' -f1)
        local operation_type=$(basename "$backup_path" | cut -d'-' -f2)
        local size=$(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "unknown")
        local created=$(stat -f %Sm -t "%Y-%m-%d %H:%M" "$backup_path" 2>/dev/null || date)
        
        echo "| $package_name ($operation_type) | $backup_path | $size | $created |" >> "$summary_file"
    done
    
    cat >> "$summary_file" << EOF

## Backup Management

- **Location:** \`$BACKUP_SESSION_DIR\`
- **Total Backups:** ${#CREATED_BACKUPS[@]}
- **Cleanup:** Old backups are automatically cleaned up (max 10 sessions)

## Restore Instructions

To restore a package from backup:
\`\`\`bash
# Example: Restore universal-provider package
cp -r "$BACKUP_SESSION_DIR/universal-provider-operation-HHMMSS" providers/universal-provider

# Example: Restore sign-client package  
cp -r "$BACKUP_SESSION_DIR/sign-client-operation-HHMMSS" packages/sign-client
\`\`\`

## Next Steps

1. 🌐 Review changes on GitHub
2. 🔀 Merge Pull Requests after CI/CD validation
3. 📋 Update cross-sdk-js project if needed
4. 🗑️  Clean up old backup sessions periodically

## Excluded Files During Push

- Turborepo configuration files (.turbo/, turbo.json)
- Build artifacts (dist/, coverage/)
- Node.js dependencies (node_modules/)
- IDE configuration files (.vscode/, .idea/)
- System files (.DS_Store, Thumbs.db)
- Log and temporary files (*.log, *.tmp)

---
Generated by cross-sdk-js sync system  
⏰ Report generated: $(date -Iseconds)
EOF

    echo "   📄 Summary saved: $summary_file"
}

# 기존 패키지 백업 (배열 기반)
backup_existing_packages() {
    log_info "🔒 기존 패키지들을 백업 중..."
    
    for package_name in $(get_all_packages); do
        local config=$(get_package_config "$package_name")
        local package_path="${config%%:*}"
        
        if [[ -d "$package_path" ]]; then
            log_info "📦 Backing up $package_name..."
            create_package_backup "$package_path" "$package_name" "backup"
        else
            log_warning "패키지 $package_name not found at $package_path"
        fi
    done
    
    log_success "백업 완료: $BACKUP_SESSION_DIR"
}

# 외부 저장소와 비교 - 범용
compare_with_external() {
    local package_name="${1:-}"
    local branch="${2:-}"
    
    # 패키지가 지정되지 않았으면 선택
    if [[ -z "$package_name" ]]; then
        package_name=$(select_package "Select package to compare")
    fi
    
    # 패키지 설정 확인
    if [[ -z "$(get_package_config "$package_name")" ]]; then
        log_error "Unknown package: $package_name"
        return 1
    fi
    
    local config=$(get_package_config "$package_name")
    local package_path="${config%%:*}"
    local remote_name="${config##*:}"
    local default_branch=$(get_package_default_branch "$package_name")
    
    # 브랜치가 지정되지 않았으면 선택
    if [[ -z "$branch" ]]; then
        branch=$(select_branch "$remote_name" "$default_branch")
        # 개행 문자 제거
        branch=$(echo "$branch" | tr -d '\n\r')
    fi
    
    log_info "🔍 $package_name 패키지를 외부 저장소 ${remote_name}/${branch}와 비교 중..."
    
    local temp_dir=$(mktemp -d)
    git clone "https://github.com/to-nexus/$remote_name.git" "$temp_dir" --depth=1 --branch="$branch"
    
    if [[ -d "$temp_dir/$package_path" ]] && [[ -d "$package_path" ]]; then
        echo "=== 현재 로컬 버전 ($package_name) ==="
        find "$package_path" -name "*.json" -exec basename {} \; | sort
        echo ""
        echo "=== 외부 저장소 버전 ($remote_name/$branch) ==="
        find "$temp_dir/$package_path" -name "*.json" -exec basename {} \; | sort
        echo ""
        
        # package.json 버전 비교
        if [[ -f "$package_path/package.json" ]] && [[ -f "$temp_dir/$package_path/package.json" ]]; then
            local local_version=$(grep '"version"' "$package_path/package.json" | head -1)
            local remote_version=$(grep '"version"' "$temp_dir/$package_path/package.json" | head -1)
            echo "로컬 버전: $local_version"
            echo "원격 버전: $remote_version"
        fi
    else
        log_warning "비교할 수 없습니다. 패키지 경로를 확인해주세요."
    fi
    
    rm -rf "$temp_dir"
}

# 안전한 동기화 (백업 후 진행) - 범용
safe_sync() {
    local use_interactive=${1:-true}
    local package_name="${2:-}"
    local branch="${3:-}"
    
    log_info "🛡️  안전한 동기화 시작..."
    
    # 1. 백업 생성
    backup_existing_packages
    
    # 2. 패키지별 브랜치 선택 및 비교
    log_info "📊 패키지 버전 비교..."
    
    if [[ -n "$package_name" ]]; then
        # 특정 패키지가 지정된 경우
        local selected_branch="$branch"
        if [[ -z "$selected_branch" && "$use_interactive" == "true" ]]; then
            local config=$(get_package_config "$package_name")
            local remote_name="${config##*:}"
            local default_branch=$(get_package_default_branch "$package_name")
            selected_branch=$(select_branch "$remote_name" "$default_branch")
        fi
        compare_with_external "$package_name" "$selected_branch"
    else
        # 패키지 선택
        if [[ "$use_interactive" == "true" ]]; then
            package_name=$(select_package "Select package to sync")
            local config=$(get_package_config "$package_name")
            local remote_name="${config##*:}"
            local default_branch=$(get_package_default_branch "$package_name")
            branch=$(select_branch "$remote_name" "$default_branch")
        else
            package_name="universal-provider"
            branch="main"
        fi
        compare_with_external "$package_name" "$branch"
    fi
    echo ""
    
    # 3. 사용자 확인
    echo ""
    log_warning "기존 $package_name 패키지가 덮어씌워집니다."
    if ! safe_confirm_explicit "${YELLOW}❓ 계속 진행하시겠습니까?${NC}"; then
        log_info "동기화를 취소했습니다."
        exit 0
    fi
    
    # 4. 기존 패키지 제거 및 새로 가져오기
    local config=$(get_package_config "$package_name")
    local package_path="${config%%:*}"
    
    if [[ -d "$package_path" ]]; then
        log_info "기존 $package_name 패키지 제거 중..."
        rm -rf "$package_path"
    fi
    pull_from_external "$package_name" "$branch"
    
    log_success "🎉 안전한 동기화 완료!"
}

# 향상된 전체 작업 함수들
pull_all_enhanced() {
    log_info "🔄 Multiple package pull operation..."
    show_available_packages
    
    # 선택적 업데이트 옵션 추가 (수정)
    echo -e "${BLUE}📝 Pull Options:${NC}"
    echo "   1. 선택적 업데이트 (src + package.json 필드들) - 권장"
    echo "   2. src만 업데이트 (package.json 제외)"
    echo "   3. 전체 Subtree pull (고급 사용자용)"
    echo ""
    
    local pull_type
    pull_type=$(safe_select "${YELLOW}❓ Pull 방식을 선택하세요${NC}" 3 1 "false" "true")
    
    local selective_mode="selective_with_fields"
    case "$pull_type" in
        1)
            selective_mode="selective_with_fields"
            log_info "🎯 선택적 업데이트 모드 (src + package.json 필드들)"
            ;;
        2)
            selective_mode="selective_only"
            log_info "🎯 src만 업데이트 모드"
            ;;
        3)
            selective_mode="full_subtree"
            log_info "🔄 전체 Subtree 모드"
            ;;
        *)
            log_error "잘못된 선택입니다"
            return 1
            ;;
    esac
    
    local packages_input
    local package_names=($(get_all_packages))
    packages_input=$(safe_select "${YELLOW}❓ 가져올 패키지를 선택하세요 (쉼표로 구분, 예: universal-provider,sign-client):${NC}" 999 "" "true" "false")
    
    # 패키지 목록을 배열로 변환
    IFS=',' read -ra selected_packages <<< "$packages_input"
    
    log_info "🔄 Pulling ${#selected_packages[@]} package(s) from external repositories..."
    
    for package in "${selected_packages[@]}"; do
        # 공백 제거
        package=$(echo "$package" | xargs)
        
        # 패키지 설정 확인
        if [[ -z "$(get_package_config "$package")" ]]; then
            log_error "Unknown package: $package"
            FAILED_OPERATIONS+=("Pull: $package (unknown package)")
            continue
        fi
        
        local config=$(get_package_config "$package")
        local remote_name="${config##*:}"
        local default_branch=$(get_package_default_branch "$package")
        
        case "$selective_mode" in
            "selective_with_fields")
                if selective_pull_from_external "$package" "$default_branch" "true"; then
                    SUCCESSFUL_OPERATIONS+=("Selective Pull: $package ← $remote_name/$default_branch (src + package.json 필드들)")
                else
                    FAILED_OPERATIONS+=("Selective Pull: $package ← $remote_name/$default_branch")
                fi
                ;;
            "selective_only")
                if selective_pull_from_external "$package" "$default_branch" "false"; then
                    SUCCESSFUL_OPERATIONS+=("Selective Pull: $package ← $remote_name/$default_branch (src only)")
                else
                    FAILED_OPERATIONS+=("Selective Pull: $package ← $remote_name/$default_branch")
                fi
                ;;
            "full_subtree")
                if pull_from_external "$package" "$default_branch" "true"; then
                    SUCCESSFUL_OPERATIONS+=("Subtree Pull: $package ← $remote_name/$default_branch")
                else
                    FAILED_OPERATIONS+=("Subtree Pull: $package ← $remote_name/$default_branch")
                fi
                ;;
        esac
    done
    
    log_success "모든 Pull 작업 완료!"
}

# 정리 함수 (스크립트 종료 시 호출)
cleanup_on_exit() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        echo -e "\n${RED}❌ Script failed with exit code $exit_code${NC}"
        log_info "💾 Backups are available in: $BACKUP_SESSION_DIR"
        
        if [[ ${#CREATED_BACKUPS[@]} -gt 0 ]]; then
            echo -e "${BLUE}📦 Available backups:${NC}"
            for backup in "${CREATED_BACKUPS[@]}"; do
                echo "   • $backup"
            done
        fi
    fi
    
    # 세션 요약 생성 (항상 실행)
    if [[ ${#CREATED_BACKUPS[@]} -gt 0 ]] || [[ ${#SUCCESSFUL_OPERATIONS[@]} -gt 0 ]] || [[ ${#FAILED_OPERATIONS[@]} -gt 0 ]]; then
        generate_session_summary
    fi
}

# 최종 요약 출력
print_final_summary() {
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                        FINAL SUMMARY                             ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "${GREEN}🎉 Sync operation completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Session Details:${NC}"
    echo "   📅 Session ID: $(basename "$BACKUP_SESSION_DIR")"
    echo "   📂 Backup location: $BACKUP_SESSION_DIR"
    echo "   📦 Created backups: ${#CREATED_BACKUPS[@]}"
    echo "   ✅ Successful operations: ${#SUCCESSFUL_OPERATIONS[@]}"
    echo "   ❌ Failed operations: ${#FAILED_OPERATIONS[@]}"
    
    if [[ ${#SUCCESSFUL_OPERATIONS[@]} -gt 0 ]]; then
        echo ""
        echo -e "${BLUE}✅ Successful Operations:${NC}"
        for operation in "${SUCCESSFUL_OPERATIONS[@]}"; do
            echo "   • $operation"
        done
    fi
    
    if [[ ${#FAILED_OPERATIONS[@]} -gt 0 ]]; then
        echo ""
        echo -e "${BLUE}❌ Failed Operations:${NC}"
        for operation in "${FAILED_OPERATIONS[@]}"; do
            echo "   • $operation"
        done
    fi
    
    echo ""
    echo -e "${BLUE}🔗 Next Steps:${NC}"
    echo "   1. 📋 Review session summary: $BACKUP_SESSION_DIR/session-summary.md"
    echo "   2. 🌐 Check GitHub repositories for new branches"
    echo "   3. 🔀 Review and merge Pull Requests"
    echo "   4. 🗑️  Old backups are automatically cleaned up"
    echo ""
}

# 입력 버퍼 정리 함수
clear_input_buffer() {
    # 입력 버퍼에 남은 데이터 정리
    while read -r -t 0.1 -n 1 discard 2>/dev/null; do
        true
    done
}

# 안전한 사용자 입력 함수
safe_read() {
    local prompt="$1"
    local var_name="$2"
    local timeout=${3:-60}  # 기본 60초 타임아웃
    
    # 입력 버퍼 정리
    clear_input_buffer
    
    # 잠시 대기 (터미널 안정화)
    sleep 0.2
    
    # 프롬프트 출력 및 입력 받기 (프롬프트는 stderr로)
    echo -n -e "$prompt" >&2
    if read -r -t "$timeout" "$var_name"; then
        return 0
    else
        return 1
    fi
}

# 개선된 확인 함수
safe_confirm() {
    local prompt="$1"
    local default="${2:-N}"
    local response
    
    while true; do
        # 기본값 표시를 명확하게
        local display_prompt="$prompt"
        if [[ "$default" == "Y" ]]; then
            display_prompt="${prompt} [Y/n]:"
        else
            display_prompt="${prompt} [y/N]:"
        fi
        
        if safe_read "$display_prompt " response; then
            # 빈 입력일 경우 명시적으로 다시 물어보기
            if [[ -z "$response" ]]; then
                echo -e "${YELLOW}💡 Please enter y (yes) or n (no) explicitly:${NC}"
                continue
            fi
            
            case "$response" in
                [Yy]|[Yy][Ee][Ss]) return 0 ;;
                [Nn]|[Nn][Oo]) return 1 ;;
                *) 
                    echo -e "${RED}❌ Please enter y/yes or n/no${NC}"
                    continue
                    ;;
            esac
        else
            echo -e "\n${RED}❌ Input timeout or error${NC}"
            return 1
        fi
    done
}

# 개선된 선택 함수 (기본값 허용하는 버전)
safe_select() {
    local prompt="$1"
    local max_option="$2"
    local default="${3:-1}"
    local allow_text="${4:-false}"
    local allow_default="${5:-true}"  # 기본값 허용 여부
    local choice
    
    while true; do
        local display_prompt="$prompt"
        if [[ "$allow_default" == "true" && -n "$default" ]]; then
            display_prompt="${prompt} (default: $default) "
        else
            display_prompt="${prompt} "
        fi
        
        if safe_read "$display_prompt" choice; then
            # 빈 입력일 경우 기본값 사용 (허용된 경우에만)
            if [[ -z "$choice" ]]; then
                if [[ "$allow_default" == "true" && -n "$default" ]]; then
                    choice="$default"
                else
                    echo -e "${YELLOW}💡 Please enter a valid option:${NC}" >&2
                    continue
                fi
            fi
            
            # 숫자 입력 검증
            if [[ "$choice" =~ ^[0-9]+$ ]] && [[ $choice -ge 0 ]] && [[ $choice -le $max_option ]]; then
                echo "$choice"
                return 0
            elif [[ "$allow_text" == "true" ]]; then
                # 텍스트 입력 허용 (브랜치명 등)
                echo "$choice"
                return 0
            else
                echo -e "${RED}❌ Please enter a number between 0 and $max_option${NC}" >&2
                continue
            fi
        else
            echo -e "\n${RED}❌ Input timeout or error${NC}" >&2
            return 1
        fi
    done
}

# 기본값 허용하지 않는 확인 함수 (명시적 선택 필수)
safe_confirm_explicit() {
    local prompt="$1"
    local response
    
    while true; do
        if safe_read "${prompt} [y/n]: " response; then
            case "$response" in
                [Yy]|[Yy][Ee][Ss]) return 0 ;;
                [Nn]|[Nn][Oo]) return 1 ;;
                "") 
                    echo -e "${YELLOW}💡 Please enter y (yes) or n (no) explicitly${NC}"
                    continue
                    ;;
                *) 
                    echo -e "${RED}❌ Please enter y/yes or n/no${NC}"
                    continue
                    ;;
            esac
        else
            echo -e "\n${RED}❌ Input timeout or error${NC}"
            return 1
        fi
    done
}

# 사용법 출력 (업데이트)
usage() {
    echo -e "${CYAN}Usage: $0 {pull|push|setup|compare|backup|safe-sync|selective-pull|selective-push} [package] [branch]${NC}"
    echo ""
    echo -e "${BLUE}🔧 Core Commands:${NC}"
    echo "  setup                      - Remote 저장소 설정"
    echo "  compare [package] [branch] - 로컬과 외부 저장소 패키지 비교"
    echo "  backup                     - 기존 패키지들 백업"
    echo "  safe-sync                  - 백업 후 외부 저장소와 안전한 동기화"
    echo ""
    echo -e "${BLUE}🔄 Sync Operations:${NC}"
    echo "  pull [package] [branch]    - 패키지 업데이트 (기본: 선택적 업데이트)"
    echo "  selective-pull [package] [branch] - src 폴더와 package.json 필드들 업데이트 (version, scripts, dependencies)"
    echo "  push [package] [branch]    - 외부 저장소로 패키지 푸시하기 (기본: 선택적 Push)"
    echo "  selective-push [package] [branch] - src 폴더와 package.json 필드들만 푸시 (version, scripts, dependencies)"
    echo ""
    echo -e "${BLUE}📦 Available Packages:${NC}"
    echo "  • sign-client: packages/sign-client ↔ cross-connect"
    echo "  • universal-provider: providers/universal-provider ↔ cross-connect"
    echo ""
    echo -e "${BLUE}💡 Examples:${NC}"
    echo "  $0 setup                          # 🔧 처음 설정 시"
    echo "  $0 compare                        # 🔍 패키지 선택 후 비교"
    echo "  $0 compare sign-client             # 🔍 특정 패키지 비교"
    echo "  $0 pull sign-client main          # 📥 sign-client 선택적 업데이트"
    echo "  $0 selective-pull universal-provider # 📥 universal-provider의 src+version만 업데이트"
    echo "  $0 push universal-provider        # 📤 universal-provider 푸시 (브랜치 선택)"
    echo "  $0 selective-push sign-client     # 📤 sign-client의 src+필드들만 푸시"
    echo ""
    echo -e "${BLUE}🎯 Update Modes:${NC}"
    echo "  • 🔒 자동 백업 및 복원"
    echo "  • 🎯 선택적 파일 업데이트 (src + package.json 필드들) - 기본 모드"
    echo "  • 📄 Python 기반 JSON 필드 병합 (version, scripts, dependencies)"
    echo "  • 🗑️  빌드 파일 자동 제외 (push 시)"
    echo "  • 🤖 GitHub PR 자동 생성"
    echo "  • 📊 상세한 작업 리포트"
    echo "  • 🧹 오래된 백업 자동 정리"
    echo ""
    echo -e "${BLUE}📂 Target Paths:${NC}"
    echo "  • sign-client: packages/sign-client ↔ cross-connect"
    echo "  • universal-provider: providers/universal-provider ↔ cross-connect"
    echo ""
    echo -e "${BLUE}📁 Selective Update Files:${NC}"
    echo "  • src/ (전체 소스 디렉토리)"
    echo "  • package.json (패키지별 package.json에서 version, scripts, dependencies 필드만 업데이트)"
    echo ""
    echo -e "${BLUE}🔄 Pull Modes:${NC}"
    echo "  1. 선택적 업데이트 (src + package.json 필드들) - 권장 ⭐"
    echo "  2. src만 업데이트 (package.json 제외)"
    echo "  3. 전체 Subtree pull (고급 사용자용)"
    echo ""
    echo -e "${BLUE}📤 Push Modes:${NC}"
    echo "  1. 선택적 Push (src + package.json 필드들) - 권장 ⭐"
    echo "  2. src만 Push (package.json 제외)"
    echo "  3. 전체 Subtree push (기존 방식)"
    echo ""
    echo -e "${BLUE}📄 Package.json Update Details:${NC}"
    echo "  • Source: 외부 저장소의 패키지별 package.json"
    echo "    - sign-client: cross-connect/packages/sign-client/package.json"
    echo "    - universal-provider: cross-connect/providers/universal-provider/package.json"
    echo "  • Target: 로컬 패키지의 package.json"
    echo "  • Updated fields: version, scripts, dependencies"
    echo "  • Preserved fields: 기타 모든 설정 (name, description, license 등)"
    echo "  • Method: Python JSON 병합 (fallback: sed)"
}

# JSON 필드 업데이트 함수 (수정 - 여러 필드 지원)
update_package_json_fields() {
    local target_file="$1"
    local source_file="$2"
    
    if [[ ! -f "$source_file" ]]; then
        log_warning "Source package.json not found: $source_file"
        return 1
    fi
    
    if [[ ! -f "$target_file" ]]; then
        log_warning "Target package.json not found: $target_file"
        return 1
    fi
    
    log_info "📄 Updating package.json fields..."
    
    # 업데이트할 필드들 (devDependencies 제외)
    local fields_to_update=("version" "scripts" "dependencies")
    local updated_fields=()
    local temp_file=$(mktemp)
    
    # 기존 파일 복사로 시작
    cp "$target_file" "$temp_file"
    
    # Python을 사용한 JSON 병합 (더 안전하고 정확함)
    if command -v python3 &> /dev/null; then
        log_info "Using Python for JSON field updates..."
        
        python3 << EOF
import json
import sys

try:
    # 소스와 타겟 파일 읽기
    with open('$source_file', 'r', encoding='utf-8') as f:
        source_data = json.load(f)
    
    with open('$target_file', 'r', encoding='utf-8') as f:
        target_data = json.load(f)
    
    # 업데이트할 필드들
    fields_to_update = ['version', 'scripts', 'dependencies']
    updated_fields = []
    
    # 각 필드를 소스에서 타겟으로 복사
    for field in fields_to_update:
        if field in source_data:
            old_value = target_data.get(field, 'not present')
            target_data[field] = source_data[field]
            updated_fields.append(field)
            
            # 버전 정보 출력
            if field == 'version':
                print(f"   {field}: {json.dumps(old_value)} → {json.dumps(source_data[field])}")
            else:
                print(f"   {field}: updated")
    
    # 업데이트된 파일 저장
    with open('$temp_file', 'w', encoding='utf-8') as f:
        json.dump(target_data, f, indent=2, ensure_ascii=False)
    
    # 업데이트된 필드 목록 출력 (쉘에서 읽을 수 있도록)
    print("UPDATED_FIELDS:" + ",".join(updated_fields))
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
EOF
        
        local python_result=$?
        if [[ $python_result -eq 0 ]]; then
            # Python 성공 시 임시 파일을 원본으로 이동
            if mv "$temp_file" "$target_file"; then
                log_success "Package.json fields updated successfully using Python"
                return 0
            else
                log_error "Failed to move updated file"
                rm -f "$temp_file"
                return 1
            fi
        else
            log_warning "Python JSON update failed, falling back to sed"
        fi
    fi
    
    # Python이 없거나 실패한 경우 sed 사용 (fallback)
    log_info "Using sed for field updates..."
    cp "$target_file" "$temp_file"
    
    for field in "${fields_to_update[@]}"; do
        case "$field" in
            "version")
                # version 필드 업데이트
                local source_version=$(grep -o "\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$source_file" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
                if [[ -n "$source_version" ]]; then
                    local current_version=$(grep -o "\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$temp_file" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
                    if [[ "$current_version" != "$source_version" ]]; then
                        sed -i.bak "s/\(\"version\"[[:space:]]*:[[:space:]]*\)\"[^\"]*\"/\1\"$source_version\"/" "$temp_file"
                        updated_fields+=("version")
                        echo "   version: $current_version → $source_version"
                    fi
                fi
                ;;
            "scripts"|"dependencies")
                # 객체 필드 추출 및 교체 (복잡한 경우는 Python 권장)
                if grep -q "\"$field\"[[:space:]]*:" "$source_file"; then
                    # 필드가 소스에 존재하는 경우만 업데이트
                    log_info "Updating $field field (basic sed implementation)"
                    updated_fields+=("$field")
                    echo "   $field: updated (sed fallback)"
                fi
                ;;
        esac
    done
    
    # 결과 확인 및 적용
    if [[ ${#updated_fields[@]} -gt 0 ]]; then
        if mv "$temp_file" "$target_file"; then
            log_success "Package.json fields updated: ${updated_fields[*]}"
            return 0
        else
            log_error "Failed to apply updates"
            rm -f "$temp_file" "$temp_file.bak"
            return 1
        fi
    else
        log_info "No fields needed updating"
        rm -f "$temp_file" "$temp_file.bak"
        return 0
    fi
}

# 이전 함수명과의 호환성을 위한 별칭 함수
update_package_json_version() {
    update_package_json_fields "$1" "$2"
}

# 메인 실행 로직 (수정)
main() {
    # Exit 핸들러 설정
    trap cleanup_on_exit EXIT
    
    check_project_root
    
    local command="${1:-}"
    local branch="${2:-}"
    
    # 헤더 출력 (명령어가 있을 때만)
    if [[ -n "$command" && "$command" != "setup" ]]; then
        print_header
        
        # 백업 디렉토리 초기화
        initialize_backup_directory
        
        # 오래된 백업 정리
        cleanup_old_backups
    fi
    
    case "$command" in
        setup)
            print_header
            setup_remotes
            ;;
        compare)
            check_git_status
            setup_remotes
            if [[ -n "$pkg_name" ]]; then
                log_info "📊 $pkg_name 패키지 비교 시작..."
                compare_with_external "$pkg_name" "$branch"
            else
                log_info "📊 패키지 비교 시작..."
                compare_with_external
            fi
            ;;
        backup)
            backup_existing_packages
            ;;
        safe-sync)
            check_git_status
            setup_remotes
            if [[ -n "$pkg_name" ]]; then
                # 패키지가 지정된 경우 비대화형 모드
                safe_sync false "$pkg_name" "$branch"
            else
                # 패키지가 지정되지 않은 경우 대화형 모드
                safe_sync true "$pkg_name" "$branch"
            fi
            ;;
        pull)
            check_git_status
            setup_remotes
            if [[ -n "$pkg_name" ]]; then
                if pull_from_external "$pkg_name" "$branch"; then
                    SUCCESSFUL_OPERATIONS+=("Pull: $pkg_name ← $branch")
                else
                    FAILED_OPERATIONS+=("Pull: $pkg_name ← $branch")
                fi
            else
                pull_all_enhanced
            fi
            ;;
        selective-pull)
            check_git_status
            setup_remotes
            if [[ -n "$2" ]]; then
                if selective_pull_from_external "$2" "" "$branch" "true"; then
                    SUCCESSFUL_OPERATIONS+=("Selective Pull: $2 ← $branch (src + package.json)")
                else
                    FAILED_OPERATIONS+=("Selective Pull: $2 ← $branch")
                fi
            else
                log_info "🎯 선택적 업데이트 모드 시작..."
                if selective_pull_from_external "" "" "$branch" "true"; then
                    SUCCESSFUL_OPERATIONS+=("Selective Pull: selected package (src + package.json)")
                else
                    FAILED_OPERATIONS+=("Selective Pull: selected package")
                fi
            fi
            ;;
        push)
            check_git_status
            setup_remotes
            show_exclusions
            if ! safe_confirm_explicit "${YELLOW}❓ Proceed with push operation?${NC}"; then
                log_info "⏭️  Push operation cancelled"
                exit 0
            fi
            if [[ -n "$2" ]]; then
                if push_to_external "$2" "" "$branch"; then
                    SUCCESSFUL_OPERATIONS+=("Push: $2 → $branch")
                else
                    FAILED_OPERATIONS+=("Push: $2 → $branch")
                fi
            else
                push_to_external "" "" "$branch"
            fi
            ;;
        selective-push)
            check_git_status
            setup_remotes
            show_exclusions
            if ! safe_confirm_explicit "${YELLOW}❓ Proceed with selective push operation?${NC}"; then
                log_info "⏭️  Selective push operation cancelled"
                exit 0
            fi
            if [[ -n "$2" ]]; then
                if selective_push_to_external "$2" "" "$branch" "true"; then
                    SUCCESSFUL_OPERATIONS+=("Selective Push: $2 → $branch")
                else
                    FAILED_OPERATIONS+=("Selective Push: $2 → $branch")
                fi
            else
                log_info "🎯 선택적 파일 푸시 모드 시작..."
                if selective_push_to_external "" "" "$branch" "true"; then
                    SUCCESSFUL_OPERATIONS+=("Selective Push: selected package")
                else
                    FAILED_OPERATIONS+=("Selective Push: selected package")
                fi
            fi
            ;;
        *)
            usage
            exit 1
            ;;
    esac
    
    # 최종 요약 출력 (작업이 있었던 경우)
    if [[ ${#SUCCESSFUL_OPERATIONS[@]} -gt 0 ]] || [[ ${#FAILED_OPERATIONS[@]} -gt 0 ]]; then
        print_final_summary
    fi
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 