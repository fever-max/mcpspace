# Desktop MVP Spec

## 1. Desktop App 전체 아키텍처

- `apps/desktop`는 Electron 기반 Desktop App이다.
- main process는 기존 `packages/workspace`의 `WorkspaceService`를 직접 import해서 재사용한다.
- renderer는 화면 렌더링만 담당하고 파일 시스템 접근이나 비즈니스 로직을 가지지 않는다.
- 상태의 단일 원천은 main process가 반환하는 `WorkspaceContextDto`, `WorkspaceStatusDto`, `SyncPlanDto`이다.
- CLI는 그대로 유지하며 Desktop App은 별도의 진입점으로 동작한다.

## 2. main / preload / renderer 역할 분리

### main process
- 앱 생명주기를 관리한다.
- `dialog.showOpenDialog()`로 workspace 폴더를 선택한다.
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

## 3. IPC 채널 명세

### 공통 규칙
- 요청은 명시적 DTO를 사용한다.
- 응답은 `IpcResult<T>` 형태를 사용한다.
- 실패 시 `{ ok: false, error: { code, message, details? } }`를 반환한다.

### 채널 표

| Channel | Request | Response | Error | Main process 호출 |
|---|---|---|---|---|
| `workspace:open` | `{}` | `WorkspaceOpenResponse` | `WORKSPACE_NOT_FOUND`, `PERMISSION_DENIED`, `UNKNOWN_ERROR` | `dialog.showOpenDialog()` + workspace session 갱신 |
| `workspace:current` | `{}` | `WorkspaceCurrentResponse` | `UNKNOWN_ERROR` | 현재 workspace session 반환 |
| `workspace:status` | `{}` | `WorkspaceStatusResponse` | `WORKSPACE_NOT_OPEN`, `VALIDATION_FAILED`, `UNKNOWN_ERROR` | `WorkspaceService.status()` |
| `workspace:plan` | `{ client }` | `WorkspacePlanResponse` | `WORKSPACE_NOT_OPEN`, `CLIENT_NOT_FOUND`, `PLAN_FAILED`, `UNKNOWN_ERROR` | `WorkspaceService.plan(client)` |
| `workspace:attach` | `{ toolName, client }` | `WorkspaceAttachResponse` | `WORKSPACE_NOT_OPEN`, `TOOL_NOT_FOUND`, `CLIENT_NOT_FOUND`, `ATTACH_FAILED`, `UNKNOWN_ERROR` | `WorkspaceService.attach(toolName, client)` |
| `workspace:detach` | `{ toolName, client }` | `WorkspaceDetachResponse` | `WORKSPACE_NOT_OPEN`, `TOOL_NOT_FOUND`, `CLIENT_NOT_FOUND`, `DETACH_FAILED`, `UNKNOWN_ERROR` | `WorkspaceService.detach(toolName, client)` |
| `workspace:sync` | `{ client }` | `WorkspaceSyncResponse` | `WORKSPACE_NOT_OPEN`, `CLIENT_NOT_FOUND`, `SYNC_FAILED`, `RESTORE_FAILED`, `UNKNOWN_ERROR` | `WorkspaceService.sync(client)` |
| `mcp:list` | `{}` | `McpListResponse` | `WORKSPACE_NOT_OPEN`, `UNKNOWN_ERROR` | `McpRegistryService.list()` |
| `mcp:add` | `{ toolName, command?, package?, args?, env? }` | `McpAddResponse` | `WORKSPACE_NOT_OPEN`, `MCP_ALREADY_EXISTS`, `VALIDATION_FAILED`, `UNKNOWN_ERROR` | `McpRegistryService.add()` |
| `mcp:remove` | `{ toolName }` | `McpRemoveResponse` | `WORKSPACE_NOT_OPEN`, `MCP_NOT_FOUND`, `MCP_ASSIGNED`, `UNKNOWN_ERROR` | `McpRegistryService.remove()` |

### MVP 범위
- `workspace:open`은 폴더 선택만 담당한다.
- `workspace:sync`는 단일 client sync만 지원한다.
- `syncAll`은 문서의 향후 확장 항목으로만 남기고 MVP 구현에는 포함하지 않는다.
- renderer는 path 문자열을 직접 계산하지 않고 main이 반환한 `WorkspaceContextDto`를 그대로 사용한다.

## 4. DTO 타입 초안

- `ClientId`: `claude-desktop | claude-code | codex | cursor`
- `WorkspaceContextDto`: `path`, `name`, `configPath`, `isOpen`
- `ClientStatusDto`: `clientName`, `outOfSync`, `error?`, `assignedMcpCount`
- `McpConfigDto`: `toolName`, `package?`, `command`, `args`, `env`, `clients`
- `McpListDto`: `items: McpConfigDto[]`
- `PlanActionDto`: `type`, `toolName`, `reasonCode`, `reason`, `desiredEntry?`, `actualEntry?`
- `SyncPlanDto`: `clientName`, `actions`, `summary`
- `WorkspaceStatusDto`: `workspace`, `clients`, `tools`, `outOfSyncCount`, `inSyncCount`
- `IpcResult<T>`: `ok: true` 또는 `ok: false` + `error`

## 5. 컴포넌트 구조

### AppShell
- 역할: 전체 레이아웃과 sidebar를 감싼다.
- props: `workspace`, `activeSection`, `children`, `onOpenWorkspace`, `onSelectSection`
- events: workspace open, section select

### Sidebar
- 역할: 좌측 섹션과 workspace 목록을 표시한다.
- props: `workspaces`, `activeWorkspacePath`, `activeSection`, `onWorkspaceSelect`, `onSectionSelect`
- events: workspace select, section select

### WorkspaceHeader
- 역할: workspace 이름, path, sync 상태, 액션 버튼을 표시한다.
- props: `workspace`, `statusSummary`, `onRefresh`, `onOpenFolder`
- events: refresh, open folder

### AiClientsCard
- 역할: client별 연결 상태와 토글을 표시한다.
- props: `clients`, `selectedClient`, `selectedToolName`, `assignments`, `onSelectClient`, `onToggleAssignment`
- events: client select, attach/detach toggle

### McpToolsCard
- 역할: MCP 목록과 선택 상태를 표시한다.
- props: `tools`, `selectedToolName`, `onSelectTool`, `onAddCustomTool`, `onRemoveTool`
- events: tool select, add, remove

### ChangesToApply
- 역할: 현재 plan 결과를 보여준다.
- props: `plan`, `loading`, `error`, `onViewDiff`
- events: diff request

### SyncActions
- 역할: attach/detach/plan/sync 버튼을 제공한다.
- props: `canSync`, `selectedClient`, `selectedToolName`, `isSyncing`, `onAttach`, `onDetach`, `onPlan`, `onSync`
- events: attach, detach, plan, sync

## 6. 구현 순서

1. `apps/desktop` workspace 생성
2. Electron main / preload / renderer 골격 생성
3. `workspace:open`과 `workspace:current` 연결
4. renderer 단일 화면 표시
5. IPC DTO 확정
6. 나머지 IPC stub 정리
7. `WorkspaceService` 연결
8. plan / sync / attach / detach 실제 연결

## 7. 위험 요소

- workspace 선택과 config 경로 해석이 꼬일 수 있다.
- renderer가 상태를 자체 저장하면 단일 원천이 깨진다.
- IPC를 너무 빨리 확장하면 유지보수성이 떨어진다.
- sync 실패 시 restore 경로를 UI에서 명확히 보여줘야 한다.
- Marketplace, Doctor, Settings를 너무 빨리 넣으면 MVP 범위를 벗어난다.



