import { Question, TeacherRoom } from '../types/game';

// Storage keys
const ROOMS_STORAGE_KEY = 'apex_racer_teacher_rooms_v1';

// Default Question Banks for immediate play without needing custom sheets
export const DEFAULT_QUESTION_PACKS: Record<string, { title: string; teacher: string; questions: Question[] }> = {
  'BALAP-KILAT': {
    title: 'Otomotif & Balap Formula Super',
    teacher: 'Pak Guru Budi (Otomotif)',
    questions: [
      {
        id: 'bk-1',
        text: 'Komponen mobil apa yang berfungsi mengurangi hambatan angin dan menambah downforce?',
        correctAnswer: 'Spoiler / Sayap Belakang',
        options: ['Spoiler / Sayap Belakang', 'Knalpot Racing', 'Lampu Kabut Depan', 'Kaca Spion'],
      },
      {
        id: 'bk-2',
        text: 'Bahan bakar gas apa yang sering disuntikkan ke mesin untuk lonjakan tenaga instan?',
        correctAnswer: 'Nitrous Oxide (NOS / N2O)',
        options: ['Nitrous Oxide (NOS / N2O)', 'Karbon Dioksida (CO2)', 'Helium (He)', 'Metana murni'],
      },
      {
        id: 'bk-3',
        text: 'Berapa jumlah roda pada mobil balap Formula 1 modern?',
        correctAnswer: '4 Roda',
        options: ['4 Roda', '6 Roda', '3 Roda', '2 Roda'],
      },
      {
        id: 'bk-4',
        text: 'Sistem pengereman anti-terkunci pada mobil modern dikenal dengan singkatan apa?',
        correctAnswer: 'ABS (Anti-lock Braking System)',
        options: ['ABS (Anti-lock Braking System)', 'GPS (Global Position System)', 'ECU (Engine Control Unit)', 'RPM (Rotations Per Minute)'],
      },
      {
        id: 'bk-5',
        text: 'Bendera bermotif kotak hitam-putih di garis finish menandakan apa?',
        correctAnswer: 'Balapan telah selesai (Finish)',
        options: ['Balapan telah selesai (Finish)', 'Ada bahaya di lintasan', 'Pembalap didiskualifikasi', 'Safety car masuk track'],
      },
      {
        id: 'bk-6',
        text: 'Teknik menikung cepat dengan sengaja membuat roda belakang kehilangan cengkeraman disebut apa?',
        correctAnswer: 'Drifting / Ngepot',
        options: ['Drifting / Ngepot', 'Burnout statis', 'Wheelie', 'Pitstop'],
      },
    ],
  },
  'MAT-SMART': {
    title: 'Matematika Kilat & Logika Kecepatan',
    teacher: 'Ibu Guru Ani (Matematika)',
    questions: [
      {
        id: 'ms-1',
        text: 'Jika mobil melaju 120 km/jam, berapa jarak yang ditempuh dalam waktu 30 menit?',
        correctAnswer: '60 km',
        options: ['60 km', '40 km', '80 km', '120 km'],
      },
      {
        id: 'ms-2',
        text: 'Hasil dari 15 x 8 + 40 adalah...',
        correctAnswer: '160',
        options: ['160', '140', '175', '150'],
      },
      {
        id: 'ms-3',
        text: 'Sebuah lingkaran lintasan memiliki diameter 14 meter. Berapa kelilingnya? (π = 22/7)',
        correctAnswer: '44 meter',
        options: ['44 meter', '88 meter', '28 meter', '36 meter'],
      },
      {
        id: 'ms-4',
        text: 'Akar kuadrat dari 256 adalah...',
        correctAnswer: '16',
        options: ['16', '14', '18', '24'],
      },
      {
        id: 'ms-5',
        text: 'Sebuah mobil memiliki 4 ban. Berapa jumlah total ban pada 9 mobil balap?',
        correctAnswer: '36 ban',
        options: ['36 ban', '32 ban', '40 ban', '28 ban'],
      },
    ],
  },
  'IPA-GENIUS': {
    title: 'Sains & Gaya Gesek Fisika',
    teacher: 'Pak Guru Joko (IPA/Fisika)',
    questions: [
      {
        id: 'ig-1',
        text: 'Gaya apa yang terjadi antara ban mobil dan aspal jalan?',
        correctAnswer: 'Gaya Gesek',
        options: ['Gaya Gesek', 'Gaya Gravitasi', 'Gaya Magnet', 'Gaya Pegas'],
      },
      {
        id: 'ig-2',
        text: 'Hukum Newton ke berapa yang menyatakan bahwa setiap aksi memiliki reaksi yang sama besar dan berlawanan arah?',
        correctAnswer: 'Hukum III Newton',
        options: ['Hukum III Newton', 'Hukum I Newton', 'Hukum II Newton', 'Hukum Gravitasi Universal'],
      },
      {
        id: 'ig-3',
        text: 'Energi yang tersimpan pada benda yang bergerak disebut energi...',
        correctAnswer: 'Kinetik',
        options: ['Kinetik', 'Potensial', 'Kimia', 'Nuklir'],
      },
      {
        id: 'ig-4',
        text: 'Zat cair pendingin radiator mobil biasanya dicampur zat khusus untuk mencegah apa?',
        correctAnswer: 'Mendidih dan membeku',
        options: ['Mendidih dan membeku', 'Terbakar api', 'Menghantarkan listrik', 'Berbau tajam'],
      },
    ],
  },
  'DEFAULT': {
    title: 'Pengetahuan Umum & Kuis Juara',
    teacher: 'Guru Hebat Indonesia',
    questions: [
      {
        id: 'df-1',
        text: 'Sirkuit balap internasional kebanggaan Indonesia di Nusa Tenggara Barat bernama sirkuit apa?',
        correctAnswer: 'Sirkuit Mandalika',
        options: ['Sirkuit Mandalika', 'Sirkuit Sentul', 'Sirkuit Sepang', 'Sirkuit Silverstone'],
      },
      {
        id: 'df-2',
        text: 'Ibukota negara Indonesia yang baru di Kalimantan Timur adalah...',
        correctAnswer: 'Nusantara (IKN)',
        options: ['Nusantara (IKN)', 'Balikpapan', 'Samarinda', 'Pontianak'],
      },
      {
        id: 'df-3',
        text: 'Berapa jumlah sila dalam Pancasila dasar negara Indonesia?',
        correctAnswer: '5 Sila',
        options: ['5 Sila', '4 Sila', '6 Sila', '3 Sila'],
      },
      {
        id: 'df-4',
        text: 'Warna bendera nasional Republik Indonesia adalah...',
        correctAnswer: 'Merah dan Putih',
        options: ['Merah dan Putih', 'Merah, Putih, Biru', 'Kuning dan Hijau', 'Merah dan Hitam'],
      },
    ],
  },
};

export const SPREADSHEET_TEMPLATE_INFO = {
  templateSheetId: '10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs',
  copyUrl: 'https://docs.google.com/spreadsheets/d/10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs/copy',
  viewUrl: 'https://docs.google.com/spreadsheets/d/10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs/edit?usp=sharing',
  sheetsNewUrl: 'https://sheets.new',
  columns: [
    { col: 'A', name: 'Pertanyaan', desc: 'Isi teks soal kuis (Kolom A)' },
    { col: 'B', name: 'Jawaban Benar', desc: 'Kunci jawaban yang tepat (Kolom B)' },
    { col: 'C', name: 'Jawaban Opsional 1', desc: 'Pilihan pengecoh 1 (Kolom C)' },
    { col: 'D', name: 'Jawaban Opsional 2', desc: 'Pilihan pengecoh 2 (Kolom D)' },
    { col: 'E', name: 'Jawaban Opsional 3', desc: 'Pilihan pengecoh 3 (Kolom E)' },
  ],
  sampleCsv: `Pertanyaan,Jawaban Benar,Jawaban Opsional 1,Jawaban Opsional 2,Jawaban Opsional 3
Apa fungsi sayap belakang (spoiler) mobil balap?,Menambah downforce dan traksi,Mendinginkan mesin,Membuat mobil melompat,Hanya untuk hiasan
Berapa hasil dari 25 x 4?,100,75,90,125
Sirkuit MotoGP di Indonesia terletak di...,Mandalika Lombok,Sentul Bogor,Monas Jakarta,Jakabaring Palembang
Gaya yang menahan gerak ban di aspal adalah...,Gaya Gesek,Gaya Gravitasi,Gaya Magnet,Gaya Pegas
Warna bendera penanda balapan selesai adalah...,Hitam Putih Kotak-Kotak,Kuning Polos,Merah Darah,Hijau Terang
Zat gas apa yang disuntikkan ke mesin untuk lonjakan tenaga kilat?,Nitrous Oxide (NOS / N2O),Karbon Dioksida (CO2),Helium (He),Oksigen Murni
Ibu kota negara Indonesia yang baru di Kalimantan Timur adalah...,Nusantara (IKN),Balikpapan,Samarinda,Banjarmasin
Berapa jumlah roda pada mobil balap Formula 1?,4 Roda,6 Roda,2 Roda,3 Roda
Sistem pengereman anti-terkunci modern dikenal dengan singkatan...,ABS (Anti-lock Braking System),GPS (Global Positioning System),ECU (Engine Control Unit),RPM (Rotations Per Minute)
Jika mobil melaju 120 km/jam selama 30 menit berapa jarak tempuhnya?,60 km,40 km,80 km,120 km`,
};

export const APPS_SCRIPT_STORAGE_KEY = 'apex_apps_script_url';

export const GOOGLE_APPS_SCRIPT_SAMPLE_CODE = `/**
 * GOOGLE APPS SCRIPT DATABASE - APEX RACER EDUKASI
 * Multi-Device Database via Google Spreadsheet
 *
 * Petunjuk Deploy:
 * 1. Buka Google Spreadsheet baru di Google Drive Anda.
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus kode bawaan (myFunction), lalu tempel seluruh kode ini.
 * 4. Klik "Terapkan" (Deploy) > "Deployment Baru" (New Deployment).
 * 5. Pilih jenis roda gerigi: "Aplikasi Web" (Web App).
 *    - Deskripsi: Database Apex Racer
 *    - Jalankan sebagai: Saya (Me)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone) -> WAJIB!
 * 6. Klik "Terapkan" (Deploy), berikan izin akses Google jika diminta.
 * 7. Salin URL Aplikasi Web (berakhiran /exec) lalu tempel di Portal Guru.
 */

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var sheet = getOrCreateTokenSheet();
    var action = (e && e.parameter && e.parameter.action) || 'getRoom';
    var token = (e && e.parameter && e.parameter.token) || '';

    if (action === 'getAllRooms') {
      var data = sheet.getDataRange().getValues();
      var rooms = {};
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row[0]) {
          try {
            rooms[row[0]] = {
              token: String(row[0]),
              title: String(row[1]),
              teacherName: String(row[2]),
              teacherPhone: String(row[3] || ''),
              spreadsheetUrl: String(row[4] || ''),
              questions: JSON.parse(row[5] || '[]'),
              createdAt: Number(row[6]) || Date.now(),
              updatedAt: Number(row[7]) || Date.now()
            };
          } catch(err) {}
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', rooms: rooms }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default: find room by token
    if (token) {
      var cleanToken = String(token).toUpperCase().trim();
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).toUpperCase().trim() === cleanToken) {
          var room = {
            token: String(data[i][0]),
            title: String(data[i][1]),
            teacherName: String(data[i][2]),
            teacherPhone: String(data[i][3] || ''),
            spreadsheetUrl: String(data[i][4] || ''),
            questions: JSON.parse(data[i][5] || '[]'),
            createdAt: Number(data[i][6]) || Date.now(),
            updatedAt: Number(data[i][7]) || Date.now()
          };
          return ContentService.createTextOutput(JSON.stringify({ status: 'success', room: room }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Token tidak ditemukan di database' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var rawData = e.postData.contents;
    var contents = JSON.parse(rawData);
    var sheet = getOrCreateTokenSheet();

    var token = String(contents.token || '').toUpperCase().trim();
    if (!token) {
      throw new Error('Token wajib diisi');
    }

    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toUpperCase().trim() === token) {
        rowIndex = i + 1;
        break;
      }
    }

    var rowData = [
      token,
      contents.title || '',
      contents.teacherName || '',
      contents.teacherPhone || '',
      contents.spreadsheetUrl || '',
      JSON.stringify(contents.questions || []),
      contents.createdAt || Date.now(),
      Date.now()
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', token: token }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateTokenSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tokens') || ss.getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Token', 'Judul', 'Nama Guru', 'No WA Guru', 'Spreadsheet URL', 'Questions JSON', 'Created At', 'Updated At']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');
  }
  return sheet;
}`;

class SheetService {
  // Get configured Google Apps Script Web App URL
  public getAppsScriptUrl(): string {
    try {
      return localStorage.getItem(APPS_SCRIPT_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  // Save Apps Script Web App URL
  public setAppsScriptUrl(url: string): void {
    try {
      localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, url.trim());
    } catch (e) {
      console.warn('Failed to save Apps Script URL to localStorage', e);
    }
  }

  // Get all saved teacher rooms
  public getRooms(): Record<string, TeacherRoom> {
    try {
      const data = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse teacher rooms from localStorage', e);
    }
    return {};
  }

  // Get single room by token
  public getRoom(token: string): TeacherRoom | null {
    const rooms = this.getRooms();
    return rooms[token.toUpperCase().trim()] || null;
  }

  // Save room locally and sync to Google Apps Script database if configured
  public saveRoom(room: TeacherRoom): void {
    const rooms = this.getRooms();
    rooms[room.token.toUpperCase().trim()] = room;
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));

    // Asynchronously push to Google Apps Script database
    const appsScriptUrl = this.getAppsScriptUrl();
    if (appsScriptUrl) {
      this.syncRoomToAppsScript(room, appsScriptUrl).catch((err) => {
        console.warn('Could not sync room to Apps Script database:', err);
      });
    }
  }

  // Sync room to Google Apps Script Web App
  public async syncRoomToAppsScript(room: TeacherRoom, url: string): Promise<boolean> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(room),
        mode: 'no-cors', // standard cross-origin submission to Apps Script
      });
      return true;
    } catch (e) {
      console.warn('Sync to Apps Script error:', e);
      return false;
    }
  }

  // Fetch a room from Google Apps Script Web App across devices
  public async fetchRoomFromAppsScript(token: string): Promise<TeacherRoom | null> {
    const appsScriptUrl = this.getAppsScriptUrl();
    if (!appsScriptUrl) return null;

    try {
      const fetchUrl = `${appsScriptUrl}${appsScriptUrl.includes('?') ? '&' : '?'}action=getRoom&token=${encodeURIComponent(token.toUpperCase().trim())}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.status === 'success' && data.room) {
        // Cache to local storage
        const room: TeacherRoom = data.room;
        const rooms = this.getRooms();
        rooms[room.token.toUpperCase().trim()] = room;
        localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
        return room;
      }
    } catch (e) {
      console.warn('Fetch room from Apps Script error:', e);
    }
    return null;
  }

  // Delete room
  public deleteRoom(token: string): void {
    const rooms = this.getRooms();
    delete rooms[token.toUpperCase().trim()];
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  }

  // Find room or default pack by token (synchronous)
  public getQuestionsByToken(token: string): { questions: Question[]; title: string; teacherName: string; teacherPhone?: string } | null {
    const cleanToken = token.toUpperCase().trim();

    // Check user-created teacher rooms first
    const rooms = this.getRooms();
    if (rooms[cleanToken] && rooms[cleanToken].questions.length > 0) {
      return {
        questions: rooms[cleanToken].questions,
        title: rooms[cleanToken].title,
        teacherName: rooms[cleanToken].teacherName,
        teacherPhone: rooms[cleanToken].teacherPhone,
      };
    }

    // Check default packs
    if (DEFAULT_QUESTION_PACKS[cleanToken]) {
      const pack = DEFAULT_QUESTION_PACKS[cleanToken];
      return {
        questions: pack.questions,
        title: pack.title,
        teacherName: pack.teacher,
        teacherPhone: '081234567890',
      };
    }

    return null;
  }

  // Find room or default pack by token (asynchronous with Apps Script cloud fallback for other devices)
  public async getQuestionsByTokenAsync(token: string): Promise<{ questions: Question[]; title: string; teacherName: string; teacherPhone?: string } | null> {
    // 1. Check local cache / presets first
    const local = this.getQuestionsByToken(token);
    if (local) return local;

    // 2. Query Google Apps Script database (if student is on a different device)
    const remoteRoom = await this.fetchRoomFromAppsScript(token);
    if (remoteRoom && remoteRoom.questions.length > 0) {
      return {
        questions: remoteRoom.questions,
        title: remoteRoom.title,
        teacherName: remoteRoom.teacherName,
        teacherPhone: remoteRoom.teacherPhone,
      };
    }

    return null;
  }

  // Generate unique 6-digit room token (e.g. GURU-4829)
  public generateToken(): string {
    const prefix = 'GURU';
    const num = Math.floor(1000 + Math.random() * 9000);
    const token = `${prefix}-${num}`;
    const rooms = this.getRooms();
    if (rooms[token]) {
      return this.generateToken();
    }
    return token;
  }

  // Parse CSV text into Question array
  public parseCsvText(csvText: string): Question[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('Spreadsheet harus memiliki minimal 1 baris header dan 1 baris soal.');
    }

    const questions: Question[] = [];
    // Skip line 0 (header: Pertanyaan, Jawaban Benar, Opsional 1...)
    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCsvRow(lines[i]);
      if (row.length < 2) continue;

      const text = row[0]?.trim();
      const correctAnswer = row[1]?.trim();
      if (!text || !correctAnswer) continue;

      const rawOptions = [correctAnswer];
      for (let c = 2; c < row.length && c <= 4; c++) {
        if (row[c] && row[c].trim().length > 0) {
          rawOptions.push(row[c].trim());
        }
      }

      // Fill in generic options if teacher provided fewer than 4 options
      while (rawOptions.length < 4) {
        rawOptions.push(`Pilihan ${String.fromCharCode(65 + rawOptions.length)}`);
      }

      questions.push({
        id: `q-${i}-${Date.now()}`,
        text,
        correctAnswer,
        options: this.shuffleArray([...rawOptions]),
      });
    }

    if (questions.length === 0) {
      throw new Error('Tidak ditemukan soal yang valid. Pastikan Kolom A ada pertanyaan dan Kolom B ada jawaban benar.');
    }

    return questions;
  }

  // Fetch Google Spreadsheet and parse questions
  public async fetchAndParseSheet(urlOrCsv: string): Promise<Question[]> {
    const trimmed = urlOrCsv.trim();

    // If it's already raw CSV text (contains commas and newlines)
    if (trimmed.includes('\n') && (trimmed.includes(',') || trimmed.includes('\t'))) {
      return this.parseCsvText(trimmed);
    }

    // Handle Google Spreadsheet URL
    let fetchUrl = trimmed;

    // Pattern for Google Spreadsheet ID: docs.google.com/spreadsheets/d/([a-zA-Z0-9-_]+)
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const sheetId = match[1];
      // Convert to public CSV endpoint
      fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    } else if (trimmed.includes('/pubhtml')) {
      fetchUrl = trimmed.replace('/pubhtml', '/pub?output=csv');
    }

    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengunduh spreadsheet (Status ${response.status}). Pastikan spreadsheet disetel "Siapa saja yang memiliki link dapat melihat" (Public).`);
      }
      const csvText = await response.text();
      return this.parseCsvText(csvText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gagal memproses spreadsheet: ${msg}. Anda juga dapat menyalin-tempel teks data tabel secara langsung.`);
    }
  }

  // Parse a single CSV row handling quotes and commas
  private parseCsvRow(text: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;

    // Also support tab-separated values (TSV) from Excel/Sheets copy-paste
    if (!text.includes(',') && text.includes('\t')) {
      return text.split('\t').map((s) => s.replace(/^"|"$/g, '').trim());
    }

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuote && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  }

  // Fisher-Yates array shuffle
  public shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Open the prefilled Google Spreadsheet template with 'make a copy' prompt directly
  public openTemplateSpreadsheet(): void {
    window.open(SPREADSHEET_TEMPLATE_INFO.copyUrl, '_blank');
  }

  // Create randomized question with fresh dynamic option shuffling (anti-cheat)
  public createRandomizedQuestion(question: Question): Question {
    return {
      ...question,
      options: this.shuffleArray([...question.options]),
    };
  }

  // Create a randomized deck of questions for a player
  public createRandomizedDeck(questions: Question[]): Question[] {
    return this.shuffleArray(questions).map((q) => this.createRandomizedQuestion(q));
  }
}

export const sheetService = new SheetService();
