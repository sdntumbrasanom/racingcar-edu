import { LeaderboardEntry, GameMode } from '../types/game';

const LEADERBOARD_KEY = 'apex_racer_leaderboard_v1';

const INITIAL_GLOBAL_RECORDS: LeaderboardEntry[] = [
  {
    id: 'lead-1',
    playerName: 'Max "Speedster" Verstappen',
    token: 'GLOBAL',
    mode: 'solo',
    score: 4850,
    maxSpeedKmH: 318,
    accuracy: 100,
    timeSec: 184,
    carModel: 'Apex Formula F1',
    carColor: '#dc2626',
    date: '16 Okt 2026',
  },
  {
    id: 'lead-2',
    playerName: 'Arya Putra (Juara Nasional)',
    token: 'BALAP-KILAT',
    mode: 'solo',
    score: 4200,
    maxSpeedKmH: 305,
    accuracy: 95,
    timeSec: 162,
    carModel: 'Cyberpunk Hypercar',
    carColor: '#7c3aed',
    date: '15 Okt 2026',
  },
  {
    id: 'lead-3',
    playerName: 'Nabila Smart & Cepat',
    token: 'MAT-SMART',
    mode: 'solo',
    score: 3950,
    maxSpeedKmH: 295,
    accuracy: 100,
    timeSec: 155,
    carModel: 'Viper GT3 Supercar',
    carColor: '#0284c7',
    date: '14 Okt 2026',
  },
  {
    id: 'lead-4',
    playerName: 'Rian & Farhan (Duo Duel)',
    token: 'BALAP-KILAT',
    mode: 'battle',
    score: 3600,
    maxSpeedKmH: 288,
    accuracy: 90,
    timeSec: 140,
    carModel: 'Falcon V8 Muscle',
    carColor: '#d97706',
    date: '12 Okt 2026',
  },
  {
    id: 'lead-5',
    playerName: 'Siti Juara Fisika',
    token: 'IPA-GENIUS',
    mode: 'solo',
    score: 3300,
    maxSpeedKmH: 280,
    accuracy: 88,
    timeSec: 130,
    carModel: 'Rally Turbo 4WD',
    carColor: '#16a34a',
    date: '10 Okt 2026',
  },
];

class LeaderboardService {
  public getEntries(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read leaderboard from localStorage', e);
    }
    // Default seed
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(INITIAL_GLOBAL_RECORDS));
    return INITIAL_GLOBAL_RECORDS;
  }

  public addEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
    const list = this.getEntries();
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]} ${now.getFullYear()}`;

    const newRecord: LeaderboardEntry = {
      ...entry,
      id: `score-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: dateFormatted,
    };

    list.push(newRecord);
    // Sort descending by score, then by speed
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.maxSpeedKmH - a.maxSpeedKmH;
    });

    // Keep top 100 entries
    const trimmed = list.slice(0, 100);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
    return newRecord;
  }

  public getFilteredEntries(tokenFilter?: string, modeFilter?: GameMode | 'all'): LeaderboardEntry[] {
    const list = this.getEntries();
    return list.filter((item) => {
      if (tokenFilter && tokenFilter !== 'ALL' && item.token.toUpperCase() !== tokenFilter.toUpperCase()) {
        return false;
      }
      if (modeFilter && modeFilter !== 'all' && item.mode !== modeFilter) {
        return false;
      }
      return true;
    });
  }
}

export const leaderboardService = new LeaderboardService();
