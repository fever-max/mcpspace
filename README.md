# mcpspace

AI 클라이언트(Claude, Cursor, Codex)의 MCP 툴을 하나의 설정으로 관리하는 툴이에요.

CLI로 터미널에서 쓸 수도 있고, Desktop 앱으로 GUI에서 관리할 수도 있어요.

---

## CLI

### 설치

```bash
npm install -g mcpspace
```

로컬 개발 시:

```bash
npm install
npm run build
npm link
```

**요구 사항:** Node.js 22+

### 빠른 시작

```bash
# 1. 프로젝트 폴더에서 초기화
mcpspace init

# 2. MCP 툴 등록
mcpspace mcp add filesystem

# 3. AI 클라이언트에 연결
mcpspace attach filesystem claude-code

# 4. 실제 클라이언트 설정에 반영
mcpspace sync claude-code

# 5. 상태 확인
mcpspace status
```

### 명령어

| 명령 | 설명 |
|---|---|
| `mcpspace init` | 현재 디렉토리에 `.mcpspace/config.yaml` 생성 |
| `mcpspace mcp add <tool>` | MCP 툴 등록 |
| `mcpspace mcp remove <tool>` | MCP 툴 제거 |
| `mcpspace mcp list` | 등록된 MCP 툴 목록 |
| `mcpspace attach <tool> <client>` | 툴을 클라이언트에 연결 (Desired State 변경) |
| `mcpspace detach <tool> <client>` | 툴을 클라이언트에서 해제 (Desired State 변경) |
| `mcpspace plan <client>` | 변경 예정 사항 미리보기 |
| `mcpspace sync <client>` | 실제 클라이언트 설정에 반영 |
| `mcpspace status` | 전체 동기화 상태 확인 |

### MCP 툴 등록

카탈로그에 있는 툴:

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

옵션:

| 옵션 | 설명 |
|---|---|
| `--command <cmd>` | 실행 명령 (커스텀 툴 필수) |
| `--package <pkg>` | 패키지명 (선택) |
| `--arg <value>` | 인자 (반복 가능) |
| `--env <KEY=VALUE>` | 환경변수 (반복 가능) |

### 지원 클라이언트

| 클라이언트 | ID |
|---|---|
| Claude Desktop | `claude-desktop` |
| Claude Code | `claude-code` |
| Codex | `codex` |
| Cursor | `cursor` |

### 핵심 개념

- `attach` / `detach` — `.mcpspace/config.yaml`의 Desired State만 변경. 실제 클라이언트 설정은 건드리지 않음
- `sync` — Desired State를 실제 클라이언트 설정에 반영. 실패 시 자동 복원
- `plan` — sync 전에 변경 사항을 미리 확인
- `status` — 각 클라이언트가 Desired State와 동기화된 상태인지 확인

---

## Desktop App

GUI로 MCP 툴과 AI 클라이언트를 관리할 수 있는 Electron 앱이에요.

### 개발 모드 실행

```bash
npm install
npm run desktop:dev
```

### 화면 구성

**Empty State** — workspace 폴더를 선택하지 않은 초기 상태

**Not Initialized** — 폴더는 선택됐지만 `.mcpspace/config.yaml`이 없는 상태
- `Initialize Workspace` 버튼으로 설정 파일 생성

**Ready** — 초기화된 workspace
- AI 클라이언트 목록에서 클라이언트 선택
- 선택한 클라이언트에 연결된 MCP 툴 확인 및 변경
- Changes to Apply에서 변경 예정 사항 확인 후 적용

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
