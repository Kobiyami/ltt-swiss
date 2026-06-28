// Utilise l'API exposée par le preload Electron
// En mode dev browser, fallback sur localStorage

const isElectron = typeof window !== 'undefined' && !!(window as any).lttStorage

export interface SavedTournament {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export function saveTournament(id: string, name: string, state: object): void {
  if (isElectron) {
    (window as any).lttStorage.save(`${id}.json`, { id, name, state, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  } else {
    localStorage.setItem(`tournament_${id}`, JSON.stringify({ id, name, state, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }))
  }
}

export function loadTournament(id: string): any | null {
  if (isElectron) {
    return (window as any).lttStorage.load(`${id}.json`)
  } else {
    const data = localStorage.getItem(`tournament_${id}`)
    return data ? JSON.parse(data) : null
  }
}

export function listTournaments(): SavedTournament[] {
  if (isElectron) {
    const files = (window as any).lttStorage.list() as string[]
    return files.map((f: string) => {
      const data = (window as any).lttStorage.load(f)
      return { id: data.id, name: data.name, createdAt: data.createdAt, updatedAt: data.updatedAt }
    })
  } else {
    const results: SavedTournament[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('tournament_')) {
        const data = JSON.parse(localStorage.getItem(key)!)
        results.push({ id: data.id, name: data.name, createdAt: data.createdAt, updatedAt: data.updatedAt })
      }
    }
    return results
  }
}

export function deleteTournament(id: string): void {
  if (isElectron) {
    (window as any).lttStorage.delete(`${id}.json`)
  } else {
    localStorage.removeItem(`tournament_${id}`)
  }
}

export function createTournamentId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}