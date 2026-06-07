# Todo

현재 제품 방향에 맞춘 구현 체크리스트다.

---

## 완료된 항목

### CLI 명령어

| 명령 | 상태 |
|---|---|
| `mcpspace init` | 완료 |
| `mcpspace mcp add` (카테고리 + 커스텀 `--command`) | 완료 |
| `mcpspace mcp remove` | 완료 |
| `mcpspace mcp list` | 완료 |
| `mcpspace attach / detach` | 완료 |
| `mcpspace plan` | 완료 |
| `mcpspace sync` | 완료 |
| `mcpspace status` | 완료 |
| `mcpspace version` | 완료 |

### Adapter

| Adapter | detect | read | apply | backup | restore | validate |
|---|---|---|---|---|---|---|
| Claude Desktop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Claude Code | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Codex | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cursor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### npm 배포

- [x] `bin` 필드 및 실행 파일 진입점 확인
- [x] `npm pack` tarball 구조 확인
- [x] Windows `npm install -g` 검증
- [x] npm 배포 (`mcpspace@0.1.3`)

### Desktop 기반

- [x] Electron + electron-vite 앱 구조
- [x] main / preload / renderer 역할 분리
- [x] IPC 채널 4개 구현 (`workspace:open`, `workspace:init`, `workspace:current`, `workspace:status`)
- [x] WorkspaceSession 상태 관리 (open → not_initialized / ready 분기)
- [x] `workspace:init`으로 `.mcpspace/config.yaml` 생성
- [x] preload `window.mcpspace` API 노출
- [x] DTO 타입 정의 (`WorkspaceContextDto`, `WorkspaceStatusDto`, `ClientStatusDto` 등)
- [x] `workspace:attach` / `workspace:detach` 구현
- [x] `workspace:plan` 구현
- [x] `workspace:sync` 구현
- [x] `workspace:copy-path` / `workspace:open-in-explorer` 구현
- [x] `workspace:mcp-add` / `workspace:mcp-remove` 구현
- [x] `workspace:mcp-update` 구현

### Desktop UI

- [x] AppShell / Sidebar 레이아웃
- [x] 3-state 분기: empty / not_initialized / ready
- [x] EmptyWorkspaceView
- [x] NotInitializedWorkspaceView + Initialize Workspace 확인 모달
- [x] ReadyWorkspaceView (AI Client-first 레이아웃)
- [x] Workspace MCP Tools 전체 폭 카드
- [x] AI Client 선택 상태
- [x] 선택된 client 기준 MCP Tools 표시
- [x] Changes to Apply (draft 기반)
- [x] 상태 badge (Not initialized / In sync / Out of sync)
- [x] raw enum 제거, 사용자 라벨 적용
- [x] 라이트 / 다크 테마 토글
- [x] Project Path strip Copy / Open in Explorer 동작 연결
- [x] Add Custom Tool 모달
- [x] Edit MCP Tool 모달
- [x] Remove MCP Tool 동작
- [x] 빌드 성공

---

## P1 — Desktop 동작 실제 연결

### IPC 채널 추가

- [x] `workspace:attach` / `workspace:detach` 채널 구현
  - `channels.ts` → `workspace.attach`, `workspace.detach` 추가
  - `types.ts` → request: `{ toolName, client }`, error codes: `WORKSPACE_NOT_OPEN` / `TOOL_NOT_FOUND` / `UNKNOWN_ERROR`
  - `workspace.ipc.ts` → `WorkspaceSession.attach()` / `detach()` 호출
  - `workspace-session.ts` → `WorkspaceService.attach()` / `detach()` 연결
  - `preload/index.ts` → 노출

- [x] `workspace:plan` 채널 구현
  - `channels.ts` → `workspace.plan` 추가
  - `types.ts` → request: `{ client }`, response: `SyncPlanDto`, error codes: `WORKSPACE_NOT_OPEN` / `PLAN_FAILED` / `UNKNOWN_ERROR`
  - `workspace.ipc.ts` → `WorkspaceSession.plan(client)` 호출
  - `workspace-session.ts` → `WorkspaceService.plan()` 연결
  - `preload/index.ts` → 노출

- [x] `workspace:sync` 채널 구현
  - `channels.ts` → `workspace.sync` 추가
  - `types.ts` → request: `{ client }`, error codes: `WORKSPACE_NOT_OPEN` / `SYNC_FAILED` / `RESTORE_FAILED` / `UNKNOWN_ERROR`
  - `workspace.ipc.ts` → `WorkspaceSession.sync(client)` 호출
  - `workspace-session.ts` → `WorkspaceService.sync()` 연결
  - `preload/index.ts` → 노출

### Ready State 연결

- [x] Refresh → `workspace:status` 재조회
  - `render()`의 상단 Refresh 버튼 연결
  - `data-action="refresh-workspace"` 추가
  - `bindActionHandlers()`에서 `window.mcpspace.workspace.status()` 호출 후 화면 갱신

- [x] selectedClient 체크박스 변경 → 실제 `attach` / `detach` IPC 호출
  - 선행 조건: `workspace:attach` / `workspace:detach` 채널 구현 필요
  - `toggle-tool` 핸들러에서 draft 변경 후 즉시 IPC 호출로 교체
  - 실패 시 draft 롤백 처리

- [x] Changes to Apply → 실제 `workspace:plan` 결과로 교체
  - 선행 조건: `workspace:plan` 채널 구현 필요
  - selectedClient 변경 시마다 `workspace:plan` 호출하여 `SyncPlanDto` 수신
  - 현재 draft 기반 `buildChangeRows()` 를 plan 결과로 교체

- [x] Apply Changes → 실제 `workspace:sync` 호출
  - 선행 조건: `workspace:sync` 채널 구현 필요
  - Apply Changes 버튼 활성화 (변경사항 있을 때만)
  - 호출 후 `workspace:status` 재조회

### Sidebar

- [x] 최근 workspace 목록 유지 (localStorage, 최대 5개)
  - workspace 변경 시 localStorage 갱신
  - Sidebar에서 목록 렌더링, 클릭 시 해당 경로로 바로 열기 (`workspace:openPath` 채널 추가 필요)
  - 현재 workspace 항목 active 표시

---

## P2 — CLI 완성도 + 안정화

### CLI

- [ ] `mcpspace sync --all` 구현 (`workspaceService.syncAll()` 연결)
- [ ] `mcpspace doctor` 구현 (client 자동 탐지 + config path + OUT_OF_SYNC 요약)
- [ ] `attach` / `detach` 실패 시 rollback 처리 (`workspace-service.ts:43,58` TODO)
- [ ] `command-placeholder.ts` 제거

### 테스트

- [ ] Adapter 단위 테스트 (applyPlan create/delete/update, backup, restore)
- [ ] Reconciler plan 계산 단위 테스트
- [ ] GitHub Actions CI (typecheck + tests)

### 배포

- [ ] macOS `npm install -g` 검증
- [ ] Desktop 패키징 (electron-builder)
  - `apps/desktop/package.json`에 `build` 설정 추가 (appId, productName, win/mac 타겟)
  - Windows: `target: "nsis"` → 설치형 exe
  - macOS: `target: "dmg"`
  - 루트 `package.json`에 `desktop:package` 스크립트 추가
  - `apps/desktop/dist/` `.gitignore`에 추가

### polish

- [ ] empty / not_initialized / ready 화면 최종 시각적 정리 (앱 실제 실행 후 개선점 목록화)
- [ ] 에러 상태 UX 정리 (IPC 실패 시 컨텍스트 있는 메시지 — "sync 실패", "attach 실패" 등)

### Catalog

- [ ] 자주 쓰는 MCP 추가 (brave-search, sqlite, postgres 등)

---

## P3 — 장기

- [ ] 멀티 프로젝트 탭 UI
- [ ] Remote catalog (`mcpspace catalog add <url>`)
- [ ] Profiles (프로젝트별 MCP 세트)
- [ ] export / import
- [ ] config 마이그레이션 자동화
- [ ] MCP Marketplace

---

## 기술 부채

| 위치 | 문제 | 우선순위 |
|---|---|---|
| `workspace-service.ts:43,58` | attach/detach Desired State 저장 후 plan 실패 시 rollback 없음 | P2 |
| `register-commands.ts:180` | sync 설명 문구가 오래됨 | P2 |
| `command-placeholder.ts` | 사용되지 않는 파일 | P2 |
| catalog | 하드코딩된 목록, 확장 시 코드 수정 필요 | P3 |
