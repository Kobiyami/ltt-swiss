import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tournament } from 'swiss-pairing-engine'
import { useConfirm } from '../components/ConfirmDialog'
import { serializeTournament } from '../lib/serialization'
import { listTournaments, saveTournament, deleteTournament, createTournamentId, type SavedTournament } from '../lib/storage'

export default function Tournois() {
  const navigate = useNavigate()
  const [tournois, setTournois] = useState<SavedTournament[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [rounds, setRounds] = useState(7)
  const [dateStart, setDateStart] = useState('')
  const { confirm, dialog } = useConfirm()
 
  useEffect(() => {
    setTournois(listTournaments().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ))
  }, [])

function handleCreate() {
  const id = createTournamentId()
  const tournament = new Tournament({
    name,
    city: city || undefined,
    dateStart: dateStart || undefined,
    totalRounds: rounds,
  }, [])

  saveTournament(id, name, serializeTournament(tournament))
  navigate(`/tournoi/${id}`)
}

  function handleDelete(id: string, name: string) {
  confirm(`Supprimer le tournoi "${name}" ?`, () => {
  deleteTournament(id)
  setTournois(prev => prev.filter(t => t.id !== id))
})
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-yellow-600/30 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">♟ LTTSwiss</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-yellow-500 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition"
          >
            + Nouveau tournoi
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8 space-y-6">
        {showForm && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-yellow-400">Créer un tournoi</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom *</label>
              <input
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Open de Lyon"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ville</label>
                <input
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Lyon"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre de rondes</label>
                <input
                  type="number"
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  value={rounds}
                  onChange={e => setRounds(parseInt(e.target.value))}
                  min={1}
                  max={15}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Date de début</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
              />
            </div>

            
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!name}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50 transition"
              >
                Créer
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {tournois.length === 0 && !showForm ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-4xl mb-4">♟</p>
            <p>Aucun tournoi pour l'instant.</p>
            <p className="text-sm mt-2">Cliquez sur "+ Nouveau tournoi" pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tournois.map(t => (
              <div key={t.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-yellow-600/50 transition">
                <div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <p className="text-sm text-gray-500">
                    Modifié le {new Date(t.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/tournoi/${t.id}`)}
                    className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-semibold hover:bg-yellow-400 transition"
                  >
                    Ouvrir
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="bg-gray-700 text-red-400 px-3 py-1 rounded text-sm hover:bg-gray-600 transition"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {dialog}
    </div>
  )
}