import { Tournament } from 'swiss-pairing-engine'

export function serializeTournament(tournament: Tournament): object {
  return {
    info: tournament.info,
    players: tournament.players,
    standings: tournament.standings.map(s => ({
      ...s,
      opponentsPlayed: Array.from(s.opponentsPlayed),
    })),
    roundPairings: tournament.roundPairings,
    currentRound: tournament.currentRound,
  }
}

export function deserializeTournament(state: any): Tournament {
  const tournament = new Tournament(state.info, state.players)
  tournament.currentRound = state.currentRound
  tournament.roundPairings = state.roundPairings
  tournament.standings = state.standings.map((s: any) => ({
    ...s,
    opponentsPlayed: new Set(s.opponentsPlayed),
  }))
  return tournament
}