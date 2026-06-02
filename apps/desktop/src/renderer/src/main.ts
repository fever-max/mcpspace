import './styles/app.css'

import type { WorkspaceContextDto } from '../../shared/dtos.js'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('App root not found')
}

const render = (workspace: WorkspaceContextDto | null): void => {
  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">mcpspace</div>
        <nav class="nav">
          <button class="nav-item active">Workspaces</button>
          <button class="nav-item">Marketplace</button>
          <button class="nav-item">Changes</button>
          <button class="nav-item">Doctor</button>
          <button class="nav-item">Settings</button>
        </nav>
      </aside>
      <main class="main">
        <header class="header">
          <div>
            <div class="eyebrow">Workspace</div>
            <h1>${workspace ? workspace.name : 'No workspace selected'}</h1>
            <p class="subtitle">${workspace ? workspace.path : 'Open a workspace to begin.'}</p>
          </div>
          <div class="header-actions">
            <button id="refresh" class="button secondary">Refresh</button>
          </div>
        </header>

        <section class="card">
          <h2>Workspace Detail</h2>
          <div class="detail-grid">
            <div>
              <span class="label">Project Path</span>
              <div class="value">${workspace ? workspace.path : '—'}</div>
            </div>
            <div>
              <span class="label">Config Path</span>
              <div class="value">${workspace ? workspace.configPath : '—'}</div>
            </div>
            <div>
              <span class="label">Status</span>
              <div class="value">${workspace?.isOpen ? 'Open' : 'Closed'}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `

  document.querySelector<HTMLButtonElement>('#refresh')?.addEventListener('click', async () => {
    const result = await window.mcpspace.workspace.current()
    render(result.ok ? result.data : null)
  })
}

void window.mcpspace.workspace.current().then((result) => {
  render(result.ok ? result.data : null)
})
