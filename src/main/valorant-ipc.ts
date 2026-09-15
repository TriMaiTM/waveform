import { ipcMain } from 'electron'
import { valorantService } from './valorant-service'

export function registerValorantIpcHandlers(): void {
  ipcMain.handle('valorant:get-player-profile', async (_event, name: string, tag: string) => {
    try {
      return await valorantService.getPlayerProfile(name, tag);
    } catch (err: any) {
      console.error('[IPC valorant:get-player-profile] Error:', err.message);
      throw new Error(err.message || 'Lỗi tra cứu thông tin người chơi');
    }
  });

  ipcMain.handle('valorant:get-player-matches', async (_event, name: string, tag: string, region?: string) => {
    try {
      return await valorantService.getPlayerMatches(name, tag, region);
    } catch (err: any) {
      console.error('[IPC valorant:get-player-matches] Error:', err.message);
      throw new Error(err.message || 'Lỗi tải lịch sử trận đấu');
    }
  });

  console.log('[IPC] Registered Valorant IPC Handlers');
}
