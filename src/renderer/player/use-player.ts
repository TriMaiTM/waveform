import { useContext } from 'react'
import { PlayerContext, PlayerContextProps } from './player-context'

export function usePlayer(): PlayerContextProps {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
