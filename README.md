# mcpspace

![mcpspace](https://raw.githubusercontent.com/fever-max/mcpspace/main/assets/img/info.png)

A CLI and Desktop app for managing MCP tools across AI clients (Claude, Cursor, Codex) with a single configuration.

---

## CLI

### Installation

```bash
npm install -g mcpspace
```

**Requirements:** Node.js 22+

### Quick Start

```bash
mcpspace init
mcpspace mcp add filesystem
mcpspace attach filesystem claude-code
mcpspace sync claude-code
mcpspace status
```

### Commands

| Command | Description |
|---|---|
| `mcpspace init` | Create `.mcpspace/config.yaml` in the current directory |
| `mcpspace mcp add <tool>` | Register an MCP tool |
| `mcpspace mcp remove <tool>` | Remove an MCP tool |
| `mcpspace mcp list` | List registered MCP tools |
| `mcpspace attach <tool> <client>` | Attach a tool to a client |
| `mcpspace detach <tool> <client>` | Detach a tool from a client |
| `mcpspace plan <client>` | Preview pending changes |
| `mcpspace sync <client>` | Apply changes to the client config |
| `mcpspace status` | Show sync status across all clients |

### Adding MCP Tools

From the catalog:

```bash
mcpspace mcp add filesystem
mcpspace mcp add github
mcpspace mcp add postgres
```

Custom tool:

```bash
mcpspace mcp add my-tool \
  --command npx \
  --arg -y \
  --arg @myorg/my-mcp-server \
  --env API_KEY=mykey
```

### Supported Clients

| Client | ID |
|---|---|
| Claude Code | `claude-code` |
| Codex | `codex` |
| Cursor | `cursor` |

### How It Works

- `attach` / `detach` — Updates Desired State only. Does not touch client configs directly.
- `sync` — Applies Desired State to the actual client config. Automatically restores on failure.
- `plan` — Preview what `sync` will do before running it.
- `status` — Check whether each client is in sync with the Desired State.

---

## Desktop App

A GUI Electron app for managing MCP tools and AI clients.

### Installation

Download the installer from [GitHub Releases](https://github.com/fever-max/mcpspace/releases).

- **Windows** — `.exe` installer (NSIS)
- **macOS** — `.dmg` (coming soon)

### Build from Source

```bash
npm install
npm run desktop:package
```

Output is placed in `apps/desktop/dist/`.

### Dev Mode

```bash
npm install
npm run desktop:dev
```

### Screens

- **Workspaces** — Open a project folder and manage MCP tools per workspace
- **Not Initialized** — Folder selected but no `.mcpspace/config.yaml` yet. Click `Initialize Workspace` to create it.
- **Ready** — Select an AI client, view attached MCP tools, and apply changes.
- **Marketplace** — Browse available MCP tools and add them to your workspace.
- **Doctor** — Diagnose workspace health, config validity, and sync status.
- **Settings** — Configure theme, language, and workspace behavior.

---

## Troubleshooting

**`mcpspace` command not found**
- Re-run `npm link` and open a new terminal
- Check that the npm global bin path is in your PATH

**PowerShell execution policy error (Windows)**
- Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

**In Sync but MCP not showing in client**
- Restart the client app
- Make sure `sync` was run from the same project path the client is using

---

## CLI

### 설치

```bash
npm install -g mcpspace
```

**요구 사항:** Node.js 22+

### 빠른 시작

```bash
mcpspace init
mcpspace mcp add filesystem
mcpspace attach filesystem claude-code
mcpspace sync claude-code
mcpspace status
```

### 명령어

| 명령 | 설명 |
|---|---|
| `mcpspace init` | 현재 디렉토리에 `.mcpspace/config.yaml` 생성 |
| `mcpspace mcp add <tool>` | MCP 툴 등록 |
| `mcpspace mcp remove <tool>` | MCP 툴 제거 |
| `mcpspace mcp list` | 등록된 MCP 툴 목록 |
| `mcpspace attach <tool> <client>` | 툴을 클라이언트에 연결 |
| `mcpspace detach <tool> <client>` | 툴을 클라이언트에서 해제 |
| `mcpspace plan <client>` | 변경 예정 사항 미리보기 |
| `mcpspace sync <client>` | 실제 클라이언트 설정에 반영 |
| `mcpspace status` | 전체 동기화 상태 확인 |

### MCP 툴 등록

카탈로그 툴:

```bash
mcpspace mcp add filesystem
mcpspace mcp add github
mcpspace mcp add postgres
```

커스텀 툴:

```bash
mcpspace mcp add my-tool \
  --command npx \
  --arg -y \
  --arg @myorg/my-mcp-server \
  --env API_KEY=mykey
```

### 지원 클라이언트

| 클라이언트 | ID |
|---|---|
| Claude Code | `claude-code` |
| Codex | `codex` |
| Cursor | `cursor` |

### 핵심 개념

- `attach` / `detach` — Desired State만 변경. 실제 클라이언트 설정은 건드리지 않음
- `sync` — Desired State를 실제 클라이언트 설정에 반영. 실패 시 자동 복원
- `plan` — sync 전에 변경 사항 미리 확인
- `status` — 각 클라이언트가 Desired State와 동기화됐는지 확인

---

## Desktop App

GUI로 MCP 툴과 AI 클라이언트를 관리하는 Electron 앱.

### 설치

[GitHub Releases](https://github.com/fever-max/mcpspace/releases)에서 설치 파일 다운로드.

- **Windows** — `.exe` 설치파일 (NSIS)
- **macOS** — `.dmg` (추후 지원 예정)

### 직접 빌드

```bash
npm install
npm run desktop:package
```

빌드 결과물은 `apps/desktop/dist/`에 생성됩니다.

### 개발 모드 실행

```bash
npm install
npm run desktop:dev
```

### 화면 구성

- **작업 폴더** — 프로젝트 폴더를 열고 MCP 툴을 workspace별로 관리
- **Not Initialized** — 폴더는 선택됐지만 `.mcpspace/config.yaml`이 없는 상태. `Initialize Workspace`로 생성.
- **Ready** — AI 클라이언트 선택 후 MCP 툴 관리 및 변경 적용.
- **마켓플레이스** — 사용 가능한 MCP 툴 탐색 및 workspace에 추가.
- **진단** — workspace 상태, config 유효성, sync 상태 진단.
- **설정** — 테마, 언어, workspace 동작 설정.

---

## Troubleshooting

**`mcpspace` 명령이 인식되지 않을 때**
- `npm link` 재실행 후 새 터미널 열기
- PATH에 npm global bin 경로가 있는지 확인

**PowerShell 실행 정책 오류 (Windows)**
- `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 실행

**In Sync인데 클라이언트에서 MCP가 안 보일 때**
- 클라이언트 재시작
- `sync`를 실행한 프로젝트 경로와 클라이언트 실행 경로가 일치하는지 확인
