# Desktop MVP Spec

## 1. Desktop App 전체 아키텍처

- `apps/desktop`는 Electron 기반 Desktop App이다.
- main process는 기존 `packages/workspace`의 `WorkspaceService`를 직접 import해서 재사용한다.
- renderer는 화면 렌더링만 담당하고 파일 시스템 접근이나 비즈니스 로직을 가지지 않는다.
- 상태의 단일 원천은 main process가 반환하는 `WorkspaceContextDto`, `WorkspaceStatusDto`, `SyncPlanDto`이다.
- CLI는 그대로 유지하며 Desktop App은 별도의 진입점으로 동작한다.

## 2. Desktop UI State Model

Desktop App은 workspace 상태에 따라 아래 3개 화면을 명확히 분리한다.

### 1. Empty State

조건:

- workspace가 아직 선택되지 않은 상태
- workspace context가 `null`

화면 목표:

- 사용자가 가장 먼저 프로젝트 폴더를 열도록 유도한다.
- 중앙에 큰 empty state를 배치한다.
- `Sync Now`는 disabled 상태로 둔다.

주요 UI:

- 제목: `No workspace connected`
- 설명: `Open a project folder to connect a workspace and start managing MCP tools for your AI clients.`
- Primary CTA: `Open Workspace`
- Secondary link: `Learn more about workspaces`
- Sidebar: `No workspaces yet` 표시
- Sidebar bottom: `Open Workspace Folder` 버튼 유지

동작:

- `Open Workspace` 클릭 시 `workspace:open` IPC 호출
- 폴더 선택 후 config 존재 여부에 따라 `not_initialized` 또는 `ready`로 이동

### 2. Not Initialized State

조건:

- workspace 폴더는 선택됨
- `.mcpspace/config.yaml`이 없음
- `WorkspaceContextDto.status = not_initialized`

화면 목표:

- 사용자가 현재 폴더는 열렸지만 mcpspace workspace로 초기화되지 않았음을 이해하게 한다.
- `Initialize Workspace`를 명확한 primary action으로 제공한다.
- 자동으로 파일을 생성하지 않고, 사용자가 명시적으로 초기화 버튼을 누르게 한다.

주요 UI:

- 상단: workspace name, status badge `Not Initialized`
- `Project Path` 카드 표시
- 중앙 카드 제목: `Workspace not initialized`
- 설명: `This workspace has been opened, but it has not been initialized yet.`
- 강조 파일 경로: `.mcpspace/config.yaml`
- Primary CTA: `Initialize Workspace`
- Secondary CTA: `Open Another Workspace`
- 하단 설명 카드: `What happens when you initialize?`

동작:

- `Initialize Workspace` 클릭 시 `workspace:init` IPC 호출
- `.mcpspace/config.yaml` 생성
- 성공 후 `workspace:status` 재조회
- `ready` state로 전환
- `Open Another Workspace` 클릭 시 `workspace:open` IPC 호출

주의:

- `not_initialized` 상태에서는 `Initialize Workspace` 버튼을 카드 내부에만 둔다.
- 상단과 카드 내부에 `Initialize Workspace` 버튼을 중복 배치하지 않는다.

### 3. Ready State

조건:

- `.mcpspace/config.yaml` 존재
- `WorkspaceService.status()` 조회 가능
- `WorkspaceContextDto.status = ready`

화면 목표:

- AI-first is the MVP primary interaction model.
- 사용자는 먼저 AI Client를 선택하고, 선택한 client에 연결된 MCP Tools를 확인한다.
- 변경 예정 사항은 선택된 AI Client 기준으로 확인하고 적용한다.

주요 UI:

- 상단: workspace name, status badge `In Sync` 또는 `Out of Sync`
- Top action: `Sync Now`
- `Project Path` 카드
- `AI Clients` 카드
- `MCP Tools for {selectedClient}` 카드
- `Changes to Apply` 영역
- 하단 액션: `Review Changes`, `Apply Changes`

Ready 화면 레이아웃:

- 좌측 카드: `AI Clients`
- 우측 카드: `MCP Tools for {selectedClient}`
- 하단 전체 폭: `Changes to Apply`
- 하단 우측: `Review Changes` / `Apply Changes`

문구 규칙:

- `OUT_OF_SYNC` 같은 raw enum을 그대로 표시하지 않는다.
- 사용자용 라벨을 사용한다.

  - `OUT_OF_SYNC` → `Out of sync`
  - `IN_SYNC` → `In sync`
  - `READY` → `Ready`
  - `NOT_INITIALIZED` → `Not initialized`

Ready interaction model:

- `AI Client-first`가 MVP의 기본 상호작용 모델이다.
- `selectedClient`가 있어야 오른쪽 카드와 `Changes to Apply`가 의미를 가진다.
- `MCP Tools`는 독립적인 1차 선택 대상이 아니라, 선택된 AI Client에 종속된 하위 목록이다.
- `MCP-first` 표현은 MVP 문맥에서 사용하지 않는다.
- `MCP Tools for {selectedClient}` 구조를 UI와 문서에서 일관되게 사용한다.

## 3. main / preload / renderer 역할 분리

### main process
- 앱 생명주기를 관리한다.
- `dialog.showOpenDialog()`로 workspace 폴더를 선택한다.
- 선택한 폴더에서 `.mcpspace/config.yaml` 존재 여부를 확인한다.
- `.mcpspace/config.yaml`이 없으면 에러 종료가 아니라 `not_initialized` 상태로 반환한다.
- 사용자가 `Initialize Workspace` 버튼을 눌렀을 때만 `.mcpspace/config.yaml`을 생성한다.
- `WorkspaceService`와 `McpRegistryService`를 호출한다.
- IPC 요청을 받아 결과를 반환한다.

### preload
- renderer가 사용할 수 있는 안전한 `window.mcpspace` API를 노출한다.
- Node.js API와 Electron API를 renderer에 직접 노출하지 않는다.

### renderer
- Workspace Detail 단일 화면을 렌더링한다.
- `WorkspaceContextDto`를 기준으로 화면을 갱신한다.
- 파일 시스템을 직접 접근하지 않는다.
- `WorkspaceService`를 직접 import하지 않는다.

## 4. IPC 채널 명세

### 공통 규칙
- 요청은 명시적 DTO를 사용한다.
- 응답은 `IpcResult<T>` 형태를 사용한다.
- 실패 시 `{ ok: false, error: { code, message, details? } }`를 반환한다.

### 채널 표

| Channel | Request | Response | Error | Main process 호출 |
|---|---|---|---|---|
| `workspace:open` | `{}` | `WorkspaceOpenResponse` | `WORKSPACE_NOT_FOUND`, `PERMISSION_DENIED`, `UNKNOWN_ERROR` | `dialog.showOpenDialog()` + workspace session 갱신 + config 존재 여부 확인 |
| `workspace:init` | `{}` | `WorkspaceInitResponse` | `WORKSPACE_NOT_OPEN`, `WORKSPACE_ALREADY_INITIALIZED`, `PERMISSION_DENIED`, `UNKNOWN_ERROR` | 현재 workspace의 `.mcpspace/config.yaml` 생성 |
| `workspace:current` | `{}` | `WorkspaceCurrentResponse` | `UNKNOWN_ERROR` | 현재 workspace session 반환 |
| `workspace:status` | `{}` | `WorkspaceStatusResponse` | `WORKSPACE_NOT_OPEN`, `VALIDATION_FAILED`, `UNKNOWN_ERROR` | ready 상태에서만 `WorkspaceService.status()` |

### MVP 범위
- `workspace:open`은 폴더 선택 + `.mcpspace/config.yaml` 존재 여부 확인까지만 담당한다.
- `.mcpspace/config.yaml`이 없으면 에러 종료가 아니라 `not_initialized` 상태를 반환한다.
- `workspace:init`은 사용자가 `Initialize Workspace` 버튼을 눌렀을 때만 `.mcpspace/config.yaml`을 생성한다.
- `workspace:status`는 ready 상태에서만 `WorkspaceService.status()`를 호출한다.
- `syncAll`은 문서의 향후 확장 항목으로만 남기고 MVP 구현에는 포함하지 않는다.
- `workspace:plan`, `workspace:attach`, `workspace:detach`, `workspace:sync`, `mcp:list`, `mcp:add`, `mcp:remove` 는 Desktop MVP 이후의 확장 영역이다.
- renderer는 path 문자열을 직접 계산하지 않고 main이 반환한 `WorkspaceContextDto`를 그대로 사용한다.

## 5. DTO 타입 초안

- `ClientId`: `claude-desktop | claude-code | codex | cursor`
- `WorkspaceContextDto`: `path`, `name`, `configPath`, `status`, `isOpen`
- `WorkspaceStatusDto`: `workspace`, `clients`, `tools`, `outOfSyncCount`, `inSyncCount`
- `ClientStatusDto`: `clientName`, `outOfSync`, `error?`, `assignedMcpCount`
- `McpConfigDto`: `toolName`, `package?`, `command`, `args`, `env`, `clients`
- `SyncPlanDto`: `clientName`, `actions`, `summary`
- `IpcResult<T>`: `ok: true` 또는 `ok: false` + `error`

## 6. 컴포넌트 구조

### AppShell
- 역할: 전체 레이아웃과 sidebar를 감싼다.
- props: `workspace`, `activeSection`, `children`, `onOpenWorkspace`, `onSelectSection`
- events: workspace open, section select

### Sidebar
- 역할: 좌측 섹션과 workspace 상태를 표시한다.
- props: `workspace`, `activeSection`, `onOpenWorkspace`, `onSelectSection`
- events: workspace open, section select

### WorkspaceHeader
- 역할: workspace 이름, path, sync 상태, 액션 버튼을 표시한다.
- props: `workspace`, `statusSummary`, `onRefresh`, `onOpenFolder`, `onSyncNow`
- events: refresh, open folder, sync now

### AiClientsCard
- 역할: client별 연결 상태를 보여주고, 하나의 client를 선택하게 한다.
- props: `clients`, `selectedClient`, `onSelectClient`
- events: client select

### McpToolsCard
- 역할: `MCP Tools for {selectedClient}` 형태로 선택된 client의 MCP 목록을 보여준다.
- props: `tools`, `selectedClient`, `assignments`, `onToggleAssignment`
- events: tool toggle

### ChangesToApply
- 역할: 선택된 AI Client 기준의 변경 예정 사항을 보여준다.
- props: `plan`, `loading`, `error`, `selectedClient`, `onViewDiff`
- events: diff request

### SyncActions
- 역할: attach/detach/plan/sync 버튼을 제공한다.
- props: `canSync`, `selectedClient`, `selectedToolName`, `isSyncing`, `onAttach`, `onDetach`, `onPlan`, `onSync`
- events: attach, detach, plan, sync

## 7. 구현 순서

1. `apps/desktop` workspace 생성
2. Electron main / preload / renderer 골격 생성
3. `workspace:open`과 `workspace:init` 연결
4. `workspace:current`과 `workspace:status` 연결
5. renderer 3-state 화면 표시
6. `not_initialized` 화면과 `Initialize Workspace` 버튼 추가
7. IPC DTO 확정
8. 나머지 IPC stub 정리
9. `WorkspaceService` 연결
10. plan / sync / attach / detach 실제 연결

## 8. 위험 요소

- workspace 선택과 config 경로 해석이 꼬일 수 있다.
- renderer가 상태를 자체 저장하면 단일 원천이 깨진다.
- IPC를 너무 빨리 확장하면 유지보수성이 떨어진다.
- sync 실패 시 restore 경로를 UI에서 명확히 보여줘야 한다.
- Marketplace, Doctor, Settings를 너무 빨리 넣으면 MVP 범위를 벗어난다.
