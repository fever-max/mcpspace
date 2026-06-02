export interface BackupManager {
  createBackup(path: string): Promise<string>
}
