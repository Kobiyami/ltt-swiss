import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tournament, exportTRF, finalRanking } from 'swiss-pairing-engine'
import type { RoundPairings, GameResultInput } from 'swiss-pairing-engine'
import { loadTournament, saveTournament } from '../lib/storage'
import { useConfirm } from '../components/ConfirmDialog'
import { serializeTournament, deserializeTournament } from '../lib/serialization'

function AddPlayerForm({ onAdd }: { onAdd: (name: string, rating: number) => void }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState('')

  return (
    <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
      <input
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-48"
        placeholder="Nom du joueur"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        type="number"
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-24"
        placeholder="ELO"
        value={rating}
        onChange={e => setRating(e.target.value)}
      />
      <button
        onClick={() => {
          if (!name.trim()) return
          onAdd(name.trim(), parseInt(rating) || 1500)
          setName('')
          setRating('')
        }}
        className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-semibold hover:bg-yellow-400 transition"
      >
        + Ajouter
      </button>
    </div>
  )
}

export default function TournoiDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tournamentRef = useRef<Tournament | null>(null)
  const tournamentName = useRef<string>('')
  const [, forceUpdate] = useState(0)
  const [currentPairings, setCurrentPairings] = useState<RoundPairings | null>(null)
  const [results, setResults] = useState<Record<string, 'white' | 'black' | 'draw'>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { confirm, dialog } = useConfirm()

  useEffect(() => {
    if (!id) return
    const data = loadTournament(id)
    if (data) {
      tournamentRef.current = deserializeTournament(data.state)
      tournamentName.current = data.name
    }
    setLoading(false)
  }, [id])

  function save() {
    const t = tournamentRef.current
    if (!t || !id) return
    saveTournament(id, tournamentName.current, serializeTournament(t))
  }

  function handleGenerateRound() {
    const t = tournamentRef.current
    if (!t || !id) return
    const pairings = t.generateNextRound()
    setCurrentPairings(pairings)
    setResults({})
    setSaving(true)
    save()
    setSaving(false)
    forceUpdate(n => n + 1)
  }

  function handleSubmitResults() {
    const t = tournamentRef.current
    if (!t || !currentPairings || !id) return

    const inputs: GameResultInput[] = currentPairings.pairings.map(p => {
      if (p.isBye) return { whiteId: p.whiteId!, blackId: null, result: 'bye' }
      const key = `${p.whiteId}-${p.blackId}`
      return {
        whiteId: p.whiteId!,
        blackId: p.blackId,
        result: results[key] ?? 'draw',
      }
    })

    t.submitResults(currentPairings.round, inputs)
    setCurrentPairings(null)
    setResults({})
    setSaving(true)
    save()
    setSaving(false)
    forceUpdate(n => n + 1)
  }

  function handleExportTRF() {
    const t = tournamentRef.current
    if (!t) return
    const trf = exportTRF(t)
    const blob = new Blob([trf], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t.info.name}.trf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Chargement...</div>
  if (!tournamentRef.current) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Tournoi introuvable.</div>

  const t = tournamentRef.current
  const isComplete = t.isComplete()
  const ranked = finalRanking(t.standings)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-yellow-600/30 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-yellow-400 text-sm mb-1 transition">
              ← Retour
            </button>
            <h1 className="text-xl font-bold text-yellow-400">{t.info.name}</h1>
            <p className="text-sm text-gray-500">
              Ronde {t.currentRound} / {t.info.totalRounds}
              {t.info.city && ` — ${t.info.city}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportTRF}
              className="bg-gray-700 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition"
            >
              Exporter TRF
            </button>
            {!isComplete && !currentPairings && (
              <button
                onClick={handleGenerateRound}
                disabled={saving}
                className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 disabled:opacity-50 transition"
              >
                {saving ? 'Sauvegarde...' : `Générer ronde ${t.currentRound + 1}`}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-8">

        {t.currentRound === 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-yellow-400">Joueurs inscrits</h2>
            <div className="space-y-2">
              {t.players.map((player, idx) => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <span className="text-gray-500 w-6 text-sm">{idx + 1}</span>
                  <input
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-48"
                    value={player.name}
                    onChange={e => {
                      t.players[idx] = { ...player, name: e.target.value }
                      t.standings[idx] = { ...t.standings[idx], player: { ...player, name: e.target.value } }
                      save()
                      forceUpdate(n => n + 1)
                    }}
                  />
                  <input
                    type="number"
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-24"
                    value={player.rating}
                    onChange={e => {
                      const rating = parseInt(e.target.value) || 0
                      t.players[idx] = { ...player, rating }
                      t.standings[idx] = { ...t.standings[idx], player: { ...player, rating } }
                      save()
                      forceUpdate(n => n + 1)
                    }}
                  />
                 <button
  onClick={() => {
    confirm(`Retirer le joueur "${player.name}" de la liste ?`, () => {
      t.players.splice(idx, 1)
      t.standings.splice(idx, 1)
      t.players = t.players.map((p, i) => ({ ...p, pairingNumber: i + 1 }))
      t.standings = t.standings.map((s, i) => ({ ...s, player: { ...s.player, pairingNumber: i + 1 } }))
      save()
      forceUpdate(n => n + 1)
    })
  }}
  className="ml-auto text-red-400 hover:text-red-300 text-sm transition"
>
  Supprimer
</button>
                </div>
              ))}
            </div>
            <AddPlayerForm onAdd={(name, rating) => {
              const newId = `p${Date.now()}`
              const newPlayer = { id: newId, name, rating, pairingNumber: t.players.length + 1 }
              t.players.push(newPlayer)
              t.standings.push({
                player: newPlayer,
                score: 0,
                games: [],
                colorHistory: [],
                colorDifference: 0,
                opponentsPlayed: new Set(),
                hasHadBye: false,
                floatHistory: [],
                withdrawn: false,
              })
              save()
              forceUpdate(n => n + 1)
            }} />
          </div>
        )}

        {currentPairings && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-yellow-400">Ronde {currentPairings.round}</h2>
            <div className="space-y-2">
              {currentPairings.pairings.map(p => {
                if (p.isBye) {
                  return (
                    <div key={p.board} className="flex items-center gap-4 p-3 bg-gray-800 rounded">
                      <span className="text-gray-500 w-8 text-sm">#{p.board}</span>
                      <span className="font-medium">{t.players.find(pl => pl.id === p.whiteId)?.name ?? p.whiteId}</span>
                      <span className="text-gray-500">— BYE</span>
                    </div>
                  )
                }
                const key = `${p.whiteId}-${p.blackId}`
                const whiteName = t.players.find(pl => pl.id === p.whiteId)?.name ?? p.whiteId
                const blackName = t.players.find(pl => pl.id === p.blackId)?.name ?? p.blackId
                return (
                  <div key={p.board} className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                    <span className="text-gray-500 w-8 text-sm">#{p.board}</span>
                    <span className="font-medium w-48 text-white">{whiteName}</span>
                    <span className="text-xs bg-white text-black px-1 rounded">B</span>
                    <span className="text-gray-500 mx-1">vs</span>
                    <span className="text-xs bg-gray-800 border border-gray-600 text-white px-1 rounded">N</span>
                    <span className="font-medium w-48 text-white">{blackName}</span>
                    <select
                      className="ml-auto bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                      value={results[key] ?? 'draw'}
                      onChange={e => setResults(prev => ({
                        ...prev,
                        [key]: e.target.value as 'white' | 'black' | 'draw'
                      }))}
                    >
                      <option value="white">{whiteName} gagne</option>
                      <option value="black">{blackName} gagne</option>
                      <option value="draw">Nulle</option>
                    </select>
                  </div>
                )
              })}
            </div>
            <button
              onClick={handleSubmitResults}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50 transition"
            >
              {saving ? 'Sauvegarde...' : 'Valider les résultats'}
            </button>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-lg mb-3 text-yellow-400">
            {isComplete ? '🏆 Classement final' : 'Classement provisoire'}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="py-2 w-8">#</th>
                <th className="py-2">Joueur</th>
                <th className="py-2 text-right">ELO</th>
                <th className="py-2 text-right">Points</th>
                {!isComplete && <th className="py-2 w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, i) => (
                <tr key={s.player.id} className="border-b border-gray-800 hover:bg-gray-900 transition">
                  <td className="py-2 text-gray-500">{i + 1}</td>
                  <td className="py-2 font-medium flex items-center gap-2">
  {s.player.name}
  {s.withdrawn && <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">Retiré</span>}
</td>
                  <td className="py-2 text-right text-gray-500">{s.player.rating}</td>
                  <td className="py-2 text-right font-bold text-yellow-400">{s.score}</td>
                  {!isComplete && (
        <td className="py-2 text-right">
          {!s.withdrawn ? (
            <button
              onClick={() => {
                confirm(`Retirer ${s.player.name} du tournoi ?`, () => {
                t.withdrawPlayer(s.player.id)
                save()
                forceUpdate(n => n + 1)
                })
              }}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              Retirer
            </button>
          ) : (
            <button
              onClick={() => {
                t.standings.find(st => st.player.id === s.player.id)!.withdrawn = false
                save()
                forceUpdate(n => n + 1)
              }}
              className="text-xs text-green-400 hover:text-green-300 transition"
            >
              Réintégrer
            </button>
          )}
        </td>
      )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      {dialog}
    </div>
  )
}