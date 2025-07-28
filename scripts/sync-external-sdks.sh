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
    
    # 빌드 결과물
    "dist/"                     # 빌드 결과물
    ".next/"                    # Next.js 빌드 디렉토리
    "out/"                      # Next.js export 디렉토리
    ".parcel-cache/"            # Parcel 캐시
    ".cache-synpress/"          # Cypress 캐시
    "tsconfig.tsbuildinfo"      # TypeScript 빌드 정보
    "*.d.ts"                    # TypeScript 선언 파일
    "*.d.ts.map"                # TypeScript 선언 맵 파일
    
    # 테스트 및 커버리지
    "coverage/"                 # 테스트 커버리지
    ".coverage/"                # 커버리지 리포트
    "test-results/"             # 테스트 결과
    "playwright-report/"        # Playwright 리포트
    "screenshots/"              # 테스트 스크린샷
    
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
    
    # 백업 디렉토리
    "backups/"                  # 이 스크립트가 생성하는 백업
)

# 작업 추적 배열
declare -a CREATED_BACKUPS=()
declare -a SUCCESSFUL_OPERATIONS=()
declare -a FAILED_OPERATIONS=()

# 로그 함수 (확장)
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" >&2
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
    echo -e "${CYAN}║                  Git Subtree Sync Script                      ║${NC}"
    echo -e "${CYAN}║              cross-sdk-js ↔ cross-connect                     ║${NC}"
    echo -e "${CYAN}║                    Universal Provider Sync                    ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📋 Target Repository:${NC}"
    echo "   • cross-connect → Universal Provider"
    echo ""
    echo -e "${BLUE}📂 Local Path:${NC}"
    echo "   • providers/universal-provider"
    echo ""
    echo -e "${BLUE}🎯 Remote Path:${NC}"
    echo "   • providers/universal-provider"
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

# 현재 디렉토리가 프로젝트 루트인지 확인 (수정)
check_project_root() {
    if [[ ! -f "package.json" ]] || [[ ! -d "providers/universal-provider" ]]; then
        log_error "스크립트는 cross-sdk-js 프로젝트 루트에서 실행해야 합니다."
        log_error "현재 위치에 package.json과 providers/universal-provider 디렉토리가 있는지 확인하세요."
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

# GitHub PR 자동 생성 (수정)
create_pull_request() {
    local branch_name=$1
    local package_name=$2
    local target_repo=$3
    
    log_info "🤖 Creating PR with GitHub CLI..."
    
    local pr_title="sync($package_name): Update from cross-sdk-js"
    local pr_body="## 🔄 Package Sync from cross-sdk-js

**Package:** \`$package_name\`
**Source:** cross-sdk-js/providers/$package_name
**Target Repository:** \`$target_repo\`
**Target Branch:** \`$branch_name\`
**Backup Session:** \`$(basename "$BACKUP_SESSION_DIR")\`

### 📝 Recent Changes
$(git log --oneline -3 --pretty=format:"- %s" -- "providers/$package_name" | head -3)

### 🚫 Excluded Files
- NX configuration files (project.json, .nx/)
- Build artifacts and node_modules
- IDE and system files

### 💾 Backup Information
- Backup session: \`$BACKUP_SESSION_DIR\`
- Package backup available for rollback if needed

### ✅ Checklist
- [x] NX-specific files excluded
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
    printf "${CYAN}│${NC} 3. update/crosswallet-rn-$timestamp                     ${CYAN}│${NC}\n" >&2
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
                echo "sync/$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)"
                ;;
            2)
                local commit_msg=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "update")
                echo "feat/$(echo "$commit_msg" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')"
                ;;
            3)
                echo "update/crosswallet-rn-$(date +%Y%m%d-%H%M)"
                ;;
            4)
                echo "hotfix/urgent-$(date +%m%d-%H%M)"
                ;;
            5)
                local custom_branch
                custom_branch=$(safe_select "${YELLOW}❓ 새 브랜치명을 입력하세요:${NC}" 999 "" "true" "false")
                if [[ -n "$custom_branch" ]]; then
                    echo "$custom_branch"
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
            echo "$default_branch"
            return
        fi
        
        echo ""
        echo "=== $remote_name 저장소의 사용 가능한 브랜치 ==="
        for i in "${!branches[@]}"; do
            local branch="${branches[$i]}"
            if [[ "$branch" == "$default_branch" ]]; then
                echo "  $((i+1)). $branch (기본)"
            else
                echo "  $((i+1)). $branch"
            fi
        done
        echo "  0. 새로운 브랜치명 직접 입력"
        echo ""
        
        local choice
        choice=$(safe_select "${YELLOW}❓ 브랜치를 선택하세요:${NC}" ${#branches[@]} "1" "true" "true")
        
        # 기본값 처리 (1번 선택 = 첫 번째 브랜치, 보통 기본 브랜치)
        if [[ "$choice" == "1" ]]; then
            # 기본 브랜치를 찾아서 반환
            for branch in "${branches[@]}"; do
                if [[ "$branch" == "$default_branch" ]]; then
                    echo "$default_branch"
                    return
                fi
            done
            # 기본 브랜치가 없으면 첫 번째 브랜치
            echo "${branches[0]}"
            return
        fi
        
        # 새 브랜치명 직접 입력
        if [[ "$choice" == "0" ]]; then
            local new_branch
            new_branch=$(safe_select "${YELLOW}❓ 새 브랜치명을 입력하세요:${NC}" 999 "" "true" "false")
            if [[ -n "$new_branch" ]]; then
                echo "$new_branch"
                return
            else
                log_error "브랜치명을 입력해주세요."
                exit 1
            fi
        fi
        
        # 숫자로 선택
        if [[ "$choice" =~ ^[0-9]+$ ]] && [[ $choice -ge 1 ]] && [[ $choice -le ${#branches[@]} ]]; then
            local selected_branch="${branches[$((choice-1))]}"
            echo "$selected_branch"
            return
        fi
        
        # 브랜치명 직접 입력 확인
        for branch in "${branches[@]}"; do
            if [[ "$branch" == "$choice" ]]; then
                echo "$choice"
                return
            fi
        done
        
        log_error "잘못된 선택입니다."
        exit 1
    fi
}

# 브랜치 선택 함수 (기존 함수 교체)
select_branch() {
    local remote_name=$1
    local default_branch=${2:-main}
    
    enhanced_select_branch "$remote_name" "$default_branch" "false"
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
    
    log_info "🔗 Subtree 연결 상태 확인 중..."
    
    # .git/subtree-cache 또는 git log로 subtree 연결 확인
    if git log --grep="git-subtree-dir: $package_path" --oneline -1 &>/dev/null; then
        log_success "기존 subtree 연결 확인됨"
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
    log_info "🔗 새로운 subtree 연결 중..."
    
    if git subtree add --prefix="$package_path" "$remote_name" main --squash; then
        log_success "Subtree 연결 완료: $package_path ↔ $remote_name"
        return 0
    else
        log_error "Subtree 연결 실패"
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

# Subtree Pull (외부 저장소 → cross-sdk-js) - universal-provider 전용
pull_from_external() {
    local package_name="universal-provider"
    local remote_name="cross-connect"
    local branch=${1:-}
    
    # 브랜치가 지정되지 않았으면 선택
    if [[ -z "$branch" ]]; then
        branch=$(select_branch "$remote_name" "main")
    fi
    
    # 작업 확인
    if ! confirm_branch_operation "Pull" "$package_name" "$remote_name" "$branch"; then
        return 1
    fi
    
    log_info "📥 $package_name 패키지를 $remote_name/$branch에서 가져오는 중..."
    
    local package_path="providers/$package_name"
    
    # Subtree 연결 확인
    if ! ensure_subtree_connection; then
        log_error "Subtree 연결에 실패했습니다"
        return 1
    fi
    
    # Subtree pull 실행
    if git subtree pull \
        --prefix="$package_path" \
        --squash \
        "$remote_name" "$branch" \
        --strategy=subtree \
        -X subtree="providers/$package_name/"; then
        
        log_success "$package_name 패키지 업데이트 완료"
        return 0
    else
        log_error "Subtree pull 실패"
        return 1
    fi
}

# Subtree Push (cross-sdk-js → 외부 저장소) - universal-provider 전용
push_to_external() {
    local package_name="universal-provider"
    local remote_name="cross-connect"
    local branch=${1:-}
    
    # 브랜치가 지정되지 않았으면 선택 (push용)
    if [[ -z "$branch" ]]; then
        branch=$(enhanced_select_branch "$remote_name" "main" "true")
    fi
    
    # 작업 확인
    if ! confirm_branch_operation "Push" "$package_name" "$remote_name" "$branch"; then
        return 1
    fi
    
    local package_path="providers/$package_name"
    
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Processing Push: ${YELLOW}$package_name${NC} ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    
    echo "   📂 Source: $package_path"
    echo "   🎯 Target: $remote_name/$branch (providers/universal-provider)"
    echo "   🔗 Repository: https://github.com/to-nexus/$remote_name.git"
    echo ""
    
    # Subtree 연결 확인
    if ! ensure_subtree_connection; then
        log_error "Subtree 연결에 실패했습니다"
        return 1
    fi
    
    # 원격 브랜치 확인 및 생성
    if ! ensure_remote_branch "$remote_name" "$branch"; then
        log_error "원격 브랜치 준비에 실패했습니다"
        return 1
    fi
    
    # 변경사항 확인
    log_info "🔍 Checking recent changes in $package_name..."
    if git diff --quiet HEAD~5 HEAD -- "$package_path" 2>/dev/null; then
        log_warning "No recent changes in last 5 commits"
        if ! safe_confirm_explicit "${YELLOW}❓ Push anyway?${NC}"; then
            log_info "⏭️  Skipped $package_name"
            return 0
        fi
    else
        log_success "Recent changes found:"
        git log --oneline -3 --pretty=format:"   ${GREEN}%h${NC} %s ${YELLOW}(%cr)${NC}" -- "$package_path"
        echo ""
    fi
    
    # 백업 생성
    local backup_path
    if ! backup_path=$(create_package_backup "$package_path" "$package_name" "push"); then
        log_error "Failed to create backup, aborting push"
        return 1
    fi
    
    # 제외 파일들 임시 제거
    apply_exclusions "$package_path"
    
    # Git에 변경사항 스테이징
    git add "$package_path"
    
    # 변경사항이 있는지 확인
    if git diff --cached --quiet; then
        log_warning "No changes to commit after exclusions"
        restore_from_backup "$package_path" "$backup_path" "$package_name"
        return 0
    fi
    
    # 임시 커밋 생성
    local temp_commit_msg="temp: prepare $package_name for subtree push (exclude build files)"
    git commit -m "$temp_commit_msg"
    
    # Subtree 푸시 실행
    log_info "⬆️  Pushing $package_name to $remote_name/$branch..."
    echo "   🌿 Branch: $branch"
    echo "   📤 This may take a moment..."
    echo ""
    
    local push_success=false
    
    if git subtree push \
        --prefix="$package_path" \
        "$remote_name" \
        "$branch"; then
        
        log_success "$package_name pushed successfully!"
        push_success=true
        
        # 성공한 작업 기록
        SUCCESSFUL_OPERATIONS+=("Push: $package_name → $remote_name/$branch")
        
        # 성공 통계
        echo -e "${BLUE}📊 Push Summary:${NC}"
        echo "   📦 Package: $package_name"
        echo "   🎯 Repository: $remote_name"
        echo "   🌿 Branch: $branch" 
        echo "   💾 Backup: $backup_path"
        echo "   🗑️  Excluded build and config files"
        echo "   ⏰ Completed: $(date)"
        
    else
        log_error "Failed to push $package_name"
        push_success=false
        FAILED_OPERATIONS+=("Push: $package_name → $remote_name/$branch")
    fi
    
    # 백업에서 복원
    log_info "🔄 Restoring original files..."
    git reset HEAD~1 --hard  # 임시 커밋 제거
    
    if ! restore_from_backup "$package_path" "$backup_path" "$package_name"; then
        log_warning "Failed to restore from backup, but backup is available at: $backup_path"
    fi
    
    if $push_success; then
        log_success "🔗 Next steps:"
        echo "   1. 🌐 View branch: https://github.com/to-nexus/$remote_name/tree/$branch"
        echo "   2. 🔀 Create PR: https://github.com/to-nexus/$remote_name/compare/main...$branch"
        echo ""
        
        # GitHub CLI PR 생성 확인
        if command -v gh &> /dev/null; then
            if safe_confirm_explicit "${YELLOW}❓ Create PR automatically with GitHub CLI?${NC}"; then
                create_pull_request "$branch" "$package_name" "$remote_name"
            fi
        else
            log_warning "Install GitHub CLI (gh) for automatic PR creation"
        fi
        
        return 0
    else
        return 1
    fi
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
# Example: Restore core package
cp -r "$BACKUP_SESSION_DIR/core-operation-HHMMSS" sdk/packages/core
\`\`\`

## Next Steps

1. 🌐 Review changes on GitHub
2. 🔀 Merge Pull Requests after CI/CD validation
3. 📋 Update cross-sdk-js project if needed
4. 🗑️  Clean up old backup sessions periodically

## Excluded Files During Push

- NX configuration files (project.json, .nx/)
- Build artifacts (dist/, coverage/)
- Node.js dependencies (node_modules/)
- IDE configuration files (.vscode/, .idea/)
- System files (.DS_Store, Thumbs.db)
- Log and temporary files (*.log, *.tmp)

---
Generated by crossWallet-rn sync system  
⏰ Report generated: $(date -Iseconds)
EOF

    echo "   📄 Summary saved: $summary_file"
}

# 기존 패키지 백업 (수정)
backup_existing_packages() {
    log_info "🔒 기존 universal-provider 패키지를 백업 중..."
    
    # universal-provider 백업 생성
    if [[ -d "providers/universal-provider" ]]; then
        create_package_backup "providers/universal-provider" "universal-provider" "backup"
    fi
    
    log_success "백업 완료: $BACKUP_SESSION_DIR"
}

# 외부 저장소와 비교 - universal-provider 전용
compare_with_external() {
    local package_name="universal-provider"
    local remote_name="cross-connect"
    local branch=${1:-}
    
    # 브랜치가 지정되지 않았으면 선택
    if [[ -z "$branch" ]]; then
        branch=$(select_branch "$remote_name" "main")
    fi
    
    log_info "🔍 $package_name 패키지를 외부 저장소 $remote_name/$branch와 비교 중..."
    
    local temp_dir=$(mktemp -d)
    git clone "https://github.com/to-nexus/$remote_name.git" "$temp_dir" --depth=1 --branch="$branch"
    
    if [[ -d "$temp_dir/providers/$package_name" ]] && [[ -d "providers/$package_name" ]]; then
        echo "=== 현재 로컬 버전 ==="
        find "providers/$package_name" -name "*.json" -exec basename {} \; | sort
        echo ""
        echo "=== 외부 저장소 버전 ($remote_name/$branch) ==="
        find "$temp_dir/providers/$package_name" -name "*.json" -exec basename {} \; | sort
        echo ""
        
        # package.json 버전 비교
        if [[ -f "providers/$package_name/package.json" ]] && [[ -f "$temp_dir/providers/$package_name/package.json" ]]; then
            local local_version=$(grep '"version"' "providers/$package_name/package.json" | head -1)
            local remote_version=$(grep '"version"' "$temp_dir/providers/$package_name/package.json" | head -1)
            echo "로컬 버전: $local_version"
            echo "원격 버전: $remote_version"
        fi
    else
        log_warning "비교할 수 없습니다. 패키지 경로를 확인해주세요."
    fi
    
    rm -rf "$temp_dir"
}

# 안전한 동기화 (백업 후 진행) - universal-provider 전용
safe_sync() {
    local use_interactive=${1:-true}
    
    log_info "🛡️  안전한 동기화 시작..."
    
    # 1. 백업 생성
    backup_existing_packages
    
    # 2. 브랜치 선택 및 비교
    log_info "📊 패키지 버전 비교..."
    
    # universal-provider 패키지
    local provider_branch
    if [[ "$use_interactive" == "true" ]]; then
        echo "=== Universal Provider 패키지 브랜치 선택 ==="
        provider_branch=$(select_branch "cross-connect" "main")
    else
        provider_branch="main"
    fi
    compare_with_external "$provider_branch"
    echo ""
    
    # 3. 사용자 확인
    echo ""
    log_warning "기존 universal-provider 패키지가 덮어씌워집니다."
    if ! safe_confirm_explicit "${YELLOW}❓ 계속 진행하시겠습니까?${NC}"; then
        log_info "동기화를 취소했습니다."
        exit 0
    fi
    
    # 4. 기존 패키지 제거 및 새로 가져오기
    if [[ -d "providers/universal-provider" ]]; then
        log_info "기존 universal-provider 패키지 제거 중..."
        rm -rf "providers/universal-provider"
    fi
    pull_from_external "$provider_branch"
    
    log_success "🎉 안전한 동기화 완료!"
}

# 향상된 전체 작업 함수들
pull_all_enhanced() {
    local packages_input
    packages_input=$(safe_select "${YELLOW}❓ 가져올 패키지를 선택하세요 (예: core,sign-client,walletkit):${NC}" 999 "" "true" "false")
    
    # 패키지 목록을 배열로 변환
    IFS=',' read -ra selected_packages <<< "$packages_input"
    
    log_info "🔄 Pulling ${#selected_packages[@]} package(s) from external repositories..."
    
    for package in "${selected_packages[@]}"; do
        local remote_name
        case $package in
            "core"|"sign-client") remote_name="cross-connect" ;;
            "walletkit") remote_name="cross-walletkit" ;;
        esac
        
        if pull_from_external "$package" "$remote_name"; then
            SUCCESSFUL_OPERATIONS+=("Pull: $package ← $remote_name")
        else
            FAILED_OPERATIONS+=("Pull: $package ← $remote_name")
        fi
    done
    
    log_success "🎉 모든 Pull 작업 완료!"
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
    local timeout=${3:-30}  # 기본 30초 타임아웃
    
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

# 사용법 출력 (수정)
usage() {
    echo -e "${CYAN}Usage: $0 {pull|push|setup|compare|backup|safe-sync} [branch]${NC}"
    echo ""
    echo -e "${BLUE}🔧 Core Commands:${NC}"
    echo "  setup                - Remote 저장소 설정"
    echo "  compare              - 로컬과 외부 저장소 패키지 비교"
    echo "  backup               - 기존 universal-provider 패키지 백업"
    echo "  safe-sync            - 백업 후 외부 저장소와 안전한 동기화"
    echo ""
    echo -e "${BLUE}🔄 Sync Operations:${NC}"
    echo "  pull                 - cross-connect에서 universal-provider 가져오기"
    echo "  push                 - cross-connect로 universal-provider 푸시하기"
    echo ""
    echo -e "${BLUE}📝 Options:${NC}"
    echo "  [branch]             - 대상 브랜치 지정 (생략시 대화형 선택)"
    echo ""
    echo -e "${BLUE}💡 Examples:${NC}"
    echo "  $0 setup             # 🔧 처음 설정 시"
    echo "  $0 compare           # 🔍 버전 비교 (브랜치 선택)"
    echo "  $0 safe-sync         # 🛡️  안전한 동기화 (브랜치 선택)"
    echo "  $0 pull main         # 📥 main 브랜치에서 universal-provider 가져오기"
    echo "  $0 push feat/new     # 📤 universal-provider를 새 브랜치로 푸시"
    echo ""
    echo -e "${BLUE}🎯 Features:${NC}"
    echo "  • 🔒 자동 백업 및 복원"
    echo "  • 🗑️  NX 파일 자동 제외 (push 시)"
    echo "  • 🤖 GitHub PR 자동 생성"
    echo "  • 📊 상세한 작업 리포트"
    echo "  • 🧹 오래된 백업 자동 정리"
    echo ""
    echo -e "${BLUE}📂 Target Paths:${NC}"
    echo "  • Local:  providers/universal-provider"
    echo "  • Remote: providers/universal-provider (cross-connect repo)"
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
            log_info "📊 universal-provider 패키지 비교 시작..."
            compare_with_external "$branch"
            ;;
        backup)
            backup_existing_packages
            ;;
        safe-sync)
            check_git_status
            setup_remotes
            if [[ -n "$branch" ]]; then
                # 브랜치가 지정된 경우 비대화형 모드
                safe_sync false
            else
                # 브랜치가 지정되지 않은 경우 대화형 모드
                safe_sync true
            fi
            ;;
        pull)
            check_git_status
            setup_remotes
            if pull_from_external "$branch"; then
                SUCCESSFUL_OPERATIONS+=("Pull: universal-provider ← cross-connect")
            else
                FAILED_OPERATIONS+=("Pull: universal-provider ← cross-connect")
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
            if push_to_external "$branch"; then
                SUCCESSFUL_OPERATIONS+=("Push: universal-provider → cross-connect")
            else
                FAILED_OPERATIONS+=("Push: universal-provider → cross-connect")
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