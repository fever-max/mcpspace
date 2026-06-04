const { spawn } = require('node:child_process')

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const command = 'npm --workspace @mcpspace/desktop run dev'

const action = spawn('cmd.exe', ['/d', '/s', '/c', command], {
  stdio: 'inherit',
  env,
})

action.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1)
    return
  }

  process.exit(code ?? 1)
})