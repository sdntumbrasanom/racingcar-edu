import React, { useState } from 'react';
import { sheetService, SPREADSHEET_TEMPLATE_INFO } from '../services/sheetService';
import { TeacherRoom, Question } from '../types/game';
import {
  GraduationCap,
  KeyRound,
  Link,
  FileSpreadsheet,
  Copy,
  Check,
  Share2,
  Trash2,
  ExternalLink,
  Download,
  AlertCircle,
  HelpCircle,
  X,
  PlusCircle,
  Sparkles,
  Phone,
  Award,
} from 'lucide-react';

interface TeacherPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTokenForGame?: (token: string) => void;
  onOpenLeaderboard?: () => void;
}

export const TeacherPortalModal: React.FC<TeacherPortalModalProps> = ({
  isOpen,
  onClose,
  onSelectTokenForGame,
  onOpenLeaderboard,
}) => {
  // Login credentials state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Form states
  const [title, setTitle] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherPhone, setTeacherPhone] = useState<string>('');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'guide'>('create');
  const [previewQuestions, setPreviewQuestions] = useState<Question[] | null>(null);

  // Load saved teacher profile (name & phone)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('apex_teacher_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teacherName) setTeacherName(parsed.teacherName);
        if (parsed.teacherPhone) setTeacherPhone(parsed.teacherPhone);
      }
    } catch {}
  }, []);

  // Load existing rooms
  const rooms = sheetService.getRooms();
  const roomList: TeacherRoom[] = Object.values(rooms);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'guru' && password.trim() === 'guruhebat') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Username atau Password salah! (Gunakan: guru / guruhebat)');
    }
  };

  const handleSaveSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Silakan masukkan link Google Spreadsheet atau teks CSV soal.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const parsedQuestions = await sheetService.fetchAndParseSheet(sheetUrl);
      const generatedToken = sheetService.generateToken();

      const newRoom: TeacherRoom = {
        token: generatedToken,
        title: title.trim() || 'Kuis Balap Pelajaran',
        teacherName: teacherName.trim() || 'Bapak/Ibu Guru',
        teacherPhone: teacherPhone.trim(),
        spreadsheetUrl: sheetUrl.trim(),
        questions: parsedQuestions,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      sheetService.saveRoom(newRoom);
      try {
        localStorage.setItem(
          'apex_teacher_profile',
          JSON.stringify({
            teacherName: teacherName.trim(),
            teacherPhone: teacherPhone.trim(),
          })
        );
      } catch {}

      setPreviewQuestions(parsedQuestions);
      setStatusMessage({
        type: 'success',
        text: `Berhasil menyimpan soal! Token baru berhasil dibuat: ${generatedToken} (${parsedQuestions.length} soal)`,
      });
      setTitle('');
      setSheetUrl('');
      setActiveTab('list');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleShareToWhatsApp = (room: TeacherRoom) => {
    const text = `🏁 *UNDANGAN BALAPAN KUIS EDUKASI* 🏁\nHalo anak-anak hebat! Mari belajar sambil seru-seruan balap mobil 🏎️💨\n\n📌 *Materi:* ${room.title}\n👨‍🏫 *Guru:* ${room.teacherName}\n🔑 *KODE TOKEN SOAL:* *${room.token}*\n\n👉 Masuk ke game balap mobil, pilih mode (Individu atau Battle), lalu masukkan nama dan Kode Token: *${room.token}*!\nSelamat bertanding dan jadilah juara! 🏆`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleDeleteRoom = (token: string) => {
    if (confirm(`Yakin ingin menghapus token ${token}?`)) {
      sheetService.deleteRoom(token);
      setStatusMessage({ type: 'success', text: `Token ${token} berhasil dihapus.` });
    }
  };

  const handleCopyTemplateData = () => {
    navigator.clipboard.writeText(SPREADSHEET_TEMPLATE_INFO.sampleCsv);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleDownloadCsvTemplate = () => {
    const blob = new Blob([SPREADSHEET_TEMPLATE_INFO.sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_soal_balap_mobil.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-indigo-500/70 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/90 via-slate-800 to-slate-900 px-6 py-4 border-b border-indigo-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-300 shadow">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                PORTAL GURU
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500 text-white uppercase tracking-wider">
                  Pengelola Soal
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Hubungkan Google Spreadsheet, buat token kelas, dan kelola kuis balapan mandiri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {!isLoggedIn ? (
          /* Login Form */
          <div className="p-8 flex flex-col items-center justify-center max-w-md mx-auto w-full my-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 shadow-lg">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Masuk Akun Guru</h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              Masukkan username dan password guru untuk mengakses pengelolaan link Google Spreadsheet & token
            </p>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (contoh: guru)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password guru"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-medium text-sm"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Masuk ke Portal Guru
              </button>

              <div className="mt-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center">
                Petunjuk Akses Default: Username: <strong className="text-indigo-300">guru</strong> | Password: <strong className="text-indigo-300">guruhebat</strong>
              </div>
            </form>
          </div>
        ) : (
          /* Logged In Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Nav Tabs & Leaderboard Access */}
            <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-800 gap-2 bg-slate-950/40 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'create'
                      ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" /> Buat Token Soal Baru
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'list'
                      ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Daftar Token Saya ({roomList.length})
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'guide'
                      ? 'border-indigo-500 text-indigo-400 bg-slate-800/80'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" /> Panduan & Format Kolom
                </button>
              </div>

              {onOpenLeaderboard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLeaderboard();
                  }}
                  className="mb-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-400" /> Buka Leaderboard Siswa 🏆
                </button>
              )}
            </div>

            {/* Notification messages */}
            {statusMessage && (
              <div
                className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="flex-1 font-medium">{statusMessage.text}</span>
              </div>
            )}

            {/* Tab 1: Create New Sheet / Token */}
            {activeTab === 'create' && (
              <div className="flex-1 overflow-y-auto p-6">
                {/* Template Quick Action Banner */}
                <div className="bg-gradient-to-r from-emerald-950/70 via-indigo-950/60 to-slate-900 p-4 rounded-xl border border-emerald-500/50 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Template Google Spreadsheet Siap Pakai
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Klik tombol di samping untuk langsung membuka template dan memilih <strong>"Make a copy"</strong>, sudah terisi petunjuk Kolom A (Pertanyaan), Kolom B (Jawaban Benar), dan Kolom C-E (Opsional).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <a
                      href="https://docs.google.com/spreadsheets/d/10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs/copy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Template (Make a Copy) ↗
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyTemplateData}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedTemplate ? 'Tersalin!' : 'Salin Format'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveSheet} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block uppercase tracking-wider">
                        Judul Kuis / Topik Materi
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Contoh: IPA Bab 4 Sirkuit Energi"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1 block uppercase tracking-wider">
                        Nama Guru / Pengajar
                      </label>
                      <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="Contoh: Pak Budi Rahardjo"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1 uppercase tracking-wider">
                        <Phone className="w-3.5 h-3.5" /> No. WhatsApp Guru
                      </label>
                      <input
                        type="tel"
                        value={teacherPhone}
                        onChange={(e) => setTeacherPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-sm font-medium"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Untuk menerima kiriman nilai mode individu dari siswa
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Link Google Spreadsheet atau Data Tabel CSV
                      </label>
                      <span className="text-[11px] text-indigo-400">
                        Spreadsheet disetel "Siapa saja dengan link dapat melihat"
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="Tempel link Google Spreadsheet hasil copy template Anda di sini (misal: https://docs.google.com/spreadsheets/d/.../edit)&#10;Atau langsung tempel hasil copy-paste tabel data di sini..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 text-sm font-mono"
                    />
                  </div>

                  {/* Format Cheat Sheet */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-indigo-300">📌 Ketentuan Kolom Spreadsheet (Sesuai Template ID 10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs):</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono mt-1">
                      <span className="bg-slate-900 p-1.5 rounded border border-slate-700">Kolom A: Pertanyaan</span>
                      <span className="bg-emerald-950/60 p-1.5 rounded border border-emerald-700/60 text-emerald-300">Kolom B: Jawaban Benar</span>
                      <span className="bg-slate-900 p-1.5 rounded border border-slate-700">Kolom C: Opsi 1</span>
                      <span className="bg-slate-900 p-1.5 rounded border border-slate-700">Kolom D: Opsi 2</span>
                      <span className="bg-slate-900 p-1.5 rounded border border-slate-700">Kolom E: Opsi 3</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSheetUrl(SPREADSHEET_TEMPLATE_INFO.sampleCsv)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Muat Contoh Data Soal Cepat
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>Memproses Soal...</>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" /> Uji & Simpan Soal (Dapatkan Token)
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: My Tokens List */}
            {activeTab === 'list' && (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {roomList.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <FileSpreadsheet className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-300">Belum ada token soal yang dibuat.</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Buka tab "Buat Token Soal Baru" untuk menghubungkan link Google Spreadsheet kuis Anda.
                    </p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Buat Token Pertama Sekarang
                    </button>
                  </div>
                ) : (
                  roomList.map((room) => (
                    <div
                      key={room.token}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500/50 transition"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400">
                            {room.token}
                          </span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            {room.questions.length} Soal Aktif
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1.5">{room.title}</h4>
                        <p className="text-xs text-slate-400">Guru: {room.teacherName}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleCopyToken(room.token)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedToken === room.token ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedToken === room.token ? 'Tersalin!' : 'Salin Kode'}
                        </button>

                        <button
                          onClick={() => handleShareToWhatsApp(room)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Bagikan ke WA Siswa
                        </button>

                        {onSelectTokenForGame && (
                          <button
                            onClick={() => {
                              onSelectTokenForGame(room.token);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow"
                          >
                            Mainkan Token Ini 🏎️
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteRoom(room.token)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                          title="Hapus Token"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Template & Instructions */}
            {activeTab === 'guide' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-300">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    Panduan Membuat Soal di Google Spreadsheet
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed">
                    <li>Buka Google Sheets (<a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a>).</li>
                    <li>Buat baris judul pada baris 1: <strong>Pertanyaan | Jawaban Benar | Opsi 1 | Opsi 2 | Opsi 3</strong>.</li>
                    <li>Isi soal kuis Anda mulai dari baris ke-2 ke bawah.</li>
                    <li>
                      Klik tombol <strong>"Bagikan (Share)"</strong> di pojok kanan atas Google Sheets.
                    </li>
                    <li>
                      Ubah akses umum menjadi: <strong>"Siapa saja yang memiliki link dapat melihat (Viewer)"</strong>.
                    </li>
                    <li>Salin link tersebut dan tempel ke tab <em>"Buat Token Soal Baru"</em> di portal guru ini.</li>
                  </ol>
                </div>

                {/* Columns Explanation */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
                    Struktur Kolom Wajib
                  </h4>
                  <div className="space-y-2">
                    {SPREADSHEET_TEMPLATE_INFO.columns.map((c) => (
                      <div key={c.col} className="flex items-start gap-3 text-xs">
                        <span className="w-20 font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800 shrink-0 text-center">
                          Kolom {c.col}
                        </span>
                        <div>
                          <strong className="text-white">{c.name}:</strong> {c.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct copy template button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl gap-3">
                  <div>
                    <p className="font-bold text-white text-xs">Buka Template Resmi Google Spreadsheet (Make a Copy)</p>
                    <p className="text-[11px] text-slate-300">ID Dokumen: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300">10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs</code>. Klik link untuk langsung membuat salinan di Google Drive Anda.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href="https://docs.google.com/spreadsheets/d/10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs/copy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Template (Make a Copy) ↗
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyTemplateData}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Salin Teks
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
