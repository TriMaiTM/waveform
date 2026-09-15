import { ipcMain } from 'electron'
import { gdService } from './gd-service'

export function registerGdIpcHandlers(): void {
  ipcMain.handle('gd:get-demons', async (_event, forceRefresh?: boolean) => {
    try {
      return await gdService.getDemons(forceRefresh);
    } catch (err: any) {
      console.error('[GD IPC] getDemons error:', err);
      throw new Error(err.message || 'Lỗi khi tải danh sách Demonlist');
    }
  });

  ipcMain.handle('gd:get-changelog', async (_event, forceRefresh?: boolean) => {
    try {
      return await gdService.getChangelog(forceRefresh);
    } catch (err: any) {
      console.error('[GD IPC] getChangelog error:', err);
      throw new Error(err.message || 'Lỗi khi tải Changelog');
    }
  });

  ipcMain.handle('gd:get-demon-detail', async (_event, uuid: string) => {
    try {
      return await gdService.getDemonDetail(uuid);
    } catch (err: any) {
      console.error('[GD IPC] getDemonDetail error:', err);
      throw new Error(err.message || 'Lỗi khi tải chi tiết Demon');
    }
  });
}
