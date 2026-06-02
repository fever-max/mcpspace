# mcpspace

MCP Workspace Manager CLI.

## Quick Start

```bash
npm run build
npm link

mcpspace init
mcpspace mcp add filesystem
mcpspace attach filesystem claude-code
mcpspace sync claude-code
mcpspace status
claude mcp get filesystem
```

## 설치

- Node.js 22+
- npm 10+

```bash
npm install
npm run build
```

## 핵심 개념

- `attach`/`detach`: Desired State만 변경
- `sync`: 실제 client config 적용 수행
- Reconciler: plan only

## MCP 등록

기본:
```bash
mcpspace mcp add filesystem
```

커스텀:
```bash
mcpspace mcp add my-mcp --command npx --arg -y --arg @modelcontextprotocol/server-filesystem --arg .
```

옵션:
- `--command <cmd>`: custom MCP 등록 시 필수
- `--package <pkg>`: 선택
- `--arg <value>`: 반복 가능
- `--env <KEY=VALUE>`: 반복 가능

## 지원 client

- `claude-desktop`
- `claude-code`
- `codex`
- `cursor`

## 주요 명령

- `mcpspace init`
- `mcpspace mcp add <tool>`
- `mcpspace mcp remove <tool>`
- `mcpspace mcp list`
- `mcpspace attach <tool> <client>`
- `mcpspace detach <tool> <client>`
- `mcpspace plan <client>`
- `mcpspace sync <client>`
- `mcpspace status`

## Troubleshooting

1. `mcpspace` 명령이 인식되지 않음
- `npm link` 재실행
- 새 터미널 열기
- PATH 확인

2. PowerShell 실행 정책 문제
- 정책에 따라 `mcpspace` 실행이 차단될 수 있음

3. IN_SYNC인데 client에서 미노출
- 동일 프로젝트 경로에서 `sync`/client 명령 실행 확인
