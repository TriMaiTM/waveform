import { ipcMain } from 'electron'
import { TftService } from './tft-service'

export function registerTftIpcHandlers(): void {
  const service = TftService.getInstance()

  ipcMain.handle('tft:get-tierlist', async (_event, rankTier?: string, days?: number) => {
    try {
      return await service.getTierList(rankTier || 'PLATINUM_PLUS', days || 1, false)
    } catch (err: any) {
      console.error('[TFT IPC] getTierList error:', err)
      throw new Error(err.message || 'Lỗi khi tải danh sách đội hình TFT')
    }
  })

  ipcMain.handle('tft:refresh-data', async (_event, rankTier?: string, days?: number) => {
    try {
      return await service.getTierList(rankTier || 'PLATINUM_PLUS', days || 1, true)
    } catch (err: any) {
      console.error('[TFT IPC] refreshData error:', err)
      throw new Error(err.message || 'Lỗi khi làm mới dữ liệu TFT')
    }
  })

  ipcMain.handle('tft:get-comp-details', async (_event, clusterId: string) => {
    try {
      if (!clusterId) throw new Error('clusterId is required')
      return await service.getCompDetails(clusterId)
    } catch (err: any) {
      console.error(`[TFT IPC] getCompDetails(${clusterId}) error:`, err)
      throw new Error(err.message || 'Lỗi khi tải chi tiết đội hình TFT')
    }
  })
}
