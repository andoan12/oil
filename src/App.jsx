import React, { useState, useEffect } from 'react';
import {
  Biohazard,
  Sparkles,
  RotateCcw,
  Play,
  Pause,
  Eye,
  Microscope,
  Compass,
  Maximize2,
  BookOpen,
  Droplets,
  Wind,
  CheckCircle2,
  Activity,
  ChevronRight,
} from 'lucide-react';
import OceanScene from './components/OceanScene.jsx';

export default function App() {
  // 'polluted' | 'remediating' | 'clean'
  const [phase, setPhase] = useState('polluted');
  // 0 to 100 (% of oil pollution removed)
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraMode, setCameraMode] = useState('overview'); // 'overview' | 'closeup' | 'topdown'
  const [showBioFacts, setShowBioFacts] = useState(false);

  // Progress timer when remediating
  useEffect(() => {
    if (phase !== 'remediating' || isPaused) return;

    const interval = setInterval(() => {
      setCleanupProgress((prev) => {
        const next = prev + 0.45 * simSpeed;
        if (next >= 100) {
          setPhase('clean');
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [phase, isPaused, simSpeed]);

  // Keyboard shortcuts for classroom presentation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'polluted') {
          handleReleaseBacteria();
        } else if (phase === 'remediating') {
          setIsPaused((p) => !p);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === '1') {
        setCameraMode('overview');
      } else if (e.key === '2') {
        setCameraMode('closeup');
      } else if (e.key === '3') {
        setCameraMode('topdown');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase]);

  const handleReleaseBacteria = () => {
    setPhase('remediating');
    setIsPaused(false);
    if (cleanupProgress >= 100) {
      setCleanupProgress(0);
    }
  };

  const handleReset = () => {
    setPhase('polluted');
    setCleanupProgress(0);
    setIsPaused(false);
    setCameraMode('overview');
  };

  const handleManualScrub = (e) => {
    const val = Number(e.target.value);
    setCleanupProgress(val);
    if (val === 0) {
      setPhase('polluted');
    } else if (val >= 100) {
      setPhase('clean');
    } else {
      setPhase('remediating');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Derived scientific metrics for UI overlays
  const oilPollutionRemaining = Math.max(0, Math.round(100 - cleanupProgress));
  const cleanPercentage = Math.min(100, Math.round(cleanupProgress));
  const co2Generated = (cleanupProgress * 1.42).toFixed(1); // tons of harmless CO2/H2O converted
  const bacteriaDensity =
    phase === 'polluted'
      ? '0'
      : phase === 'clean'
      ? 'Ổn định tự nhiên'
      : `${Math.min(98, Math.round(15 + cleanupProgress * 0.85))} triệu TB/mL`;

  // Stage Banner Config
  const stageInfo = {
    polluted: {
      step: 'GIAI ĐOẠN 1 / 3',
      title: 'SỰ CỐ TRÀN DẦU TRÊN BIỂN',
      desc: 'Lớp dầu đen (Hydrocarbon) nổi trên mặt nước, ngăn cản oxy hòa tan và đe dọa hệ sinh thái biển.',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
      dotClass: 'bg-rose-500 animate-ping',
    },
    remediating: {
      step: 'GIAI ĐOẠN 2 / 3',
      title: 'VI KHUẨN ALCANIVORAX ĐANG PHÂN HỦY DẦU',
      desc: 'Vi khuẩn bám quanh các giọt dầu, tiết enzym cắt mạch Hydrocarbon thành khí CO₂ và nước H₂O vô hại.',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      dotClass: 'bg-emerald-400 animate-ping',
    },
    clean: {
      step: 'GIAI ĐOẠN 3 / 3',
      title: 'ĐẠI DƯƠNG ĐÃ ĐƯỢC LÀM SẠCH SINH HỌC',
      desc: 'Váng dầu đã bị phân hủy hoàn toàn thành CO₂ và H₂O. Nước biển trong xanh và hệ sinh thái phục hồi!',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
      dotClass: 'bg-sky-400',
    },
  }[phase];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D Interactive Ocean Canvas */}
      <OceanScene
        phase={phase}
        cleanupProgress={cleanupProgress}
        simSpeed={simSpeed}
        isPaused={isPaused}
        cameraMode={cameraMode}
      />

      {/* Top Gradient Vignette for readability */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-slate-950/90 via-slate-950/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent" />

      {/* ================= TOP PRESENTATION HEADER ================= */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 pt-5 lg:px-10">
        {/* Title & Subject Tag */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20 backdrop-blur-md">
            <Microscope className="h-8 w-8 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg bg-emerald-400/20 px-3 py-0.5 text-sm font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">
                Sinh Học 10 • Công Nghệ Sinh Học Môi Trường
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-0.5 text-xs font-bold text-slate-300 border border-slate-700">
                Kéo chuột để xoay 3D • Cuộn để thu phóng
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md">
              XỬ LÝ TRÀN DẦU BẰNG VI KHUẨN{' '}
              <span className="text-emerald-400 italic underline decoration-emerald-500/50 decoration-wavy underline-offset-4">
                ALCANIVORAX
              </span>
            </h1>
          </div>
        </div>

        {/* Right Camera & Classroom Controls */}
        <div className="flex items-center gap-2.5 bg-slate-900/85 border border-slate-700/80 p-2 rounded-2xl backdrop-blur-md shadow-xl">
          <button
            onClick={() => setCameraMode('overview')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm sm:text-base font-extrabold transition-all ${
              cameraMode === 'overview'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Phím tắt: 1"
          >
            <Eye className="h-5 w-5" />
            <span className="hidden sm:inline">Toàn cảnh</span>
          </button>

          <button
            onClick={() => setCameraMode('closeup')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm sm:text-base font-extrabold transition-all ${
              cameraMode === 'closeup'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Phím tắt: 2 - Quan sát vi khuẩn bám vào giọt dầu"
          >
            <Microscope className="h-5 w-5" />
            <span className="hidden sm:inline">Cận cảnh phân tử</span>
          </button>

          <button
            onClick={() => setCameraMode('topdown')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm sm:text-base font-extrabold transition-all ${
              cameraMode === 'topdown'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Phím tắt: 3 - Nhìn từ trên cao"
          >
            <Compass className="h-5 w-5" />
            <span className="hidden sm:inline">Mặt biển</span>
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => setShowBioFacts((v) => !v)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm sm:text-base font-extrabold transition-all ${
              showBioFacts
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="hidden md:inline">Kiến thức</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="rounded-xl bg-slate-800 p-2.5 text-slate-200 hover:bg-slate-700 transition-colors"
            title="Toàn màn hình thuyết trình"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ================= LEFT OVERLAY: STAGE BANNER & LEGEND ================= */}
      <aside className="relative z-10 mt-4 ml-6 lg:ml-10 max-w-md space-y-3 pointer-events-auto">
        {/* Current Stage Status Card */}
        <div className="rounded-3xl bg-slate-900/85 border-2 border-slate-700/80 p-5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs sm:text-sm font-black tracking-wider uppercase ${stageInfo.badgeClass}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${stageInfo.dotClass}`} />
              {stageInfo.step}
            </span>
          </div>
          <h2 className="mt-2.5 text-xl sm:text-2xl font-black text-white leading-snug">
            {stageInfo.title}
          </h2>
          <p className="mt-1.5 text-base sm:text-lg font-medium text-slate-300 leading-relaxed">
            {stageInfo.desc}
          </p>

          {/* Biochemical Reaction Box */}
          <div className="mt-4 rounded-2xl bg-slate-950/90 border border-slate-800 p-3.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Phương trình phân hủy sinh học (Bioremediation):
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-sm sm:text-base font-black font-mono">
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-amber-300 border border-amber-500/30">
                Dầu mỏ (CₙH₂ₙ₊₂) + O₂
              </span>
              <ChevronRight className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="rounded-lg bg-emerald-950/90 px-2.5 py-1 text-sky-300 border border-sky-400/40">
                CO₂↑ + H₂O (Sạch)
              </span>
            </div>
          </div>
        </div>

        {/* Visual 3D Legend for Students */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-700/70 p-4 backdrop-blur-xl shadow-xl">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
            Chú giải mô hình 3D trên màn hình
          </div>
          <div className="grid grid-cols-1 gap-2.5 text-sm sm:text-base font-bold">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 rounded-full bg-zinc-950 border-2 border-indigo-400 shadow-inner shrink-0" />
              <span className="text-slate-200">
                Váng dầu & Giọt Hydrocarbon (Chất ô nhiễm)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-6 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981] shrink-0" />
              <span className="text-emerald-300">
                Vi khuẩn <span className="italic">Alcanivorax borkumensis</span> (Ăn dầu)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-sky-300 shadow-[0_0_10px_#38bdf8] shrink-0" />
              <span className="text-sky-300">
                Bọt khí CO₂ & Phân tử nước H₂O sau chuyển hóa
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= RIGHT OVERLAY: LIVE METRICS DASHBOARD ================= */}
      <aside className="z-10 hidden xl:flex flex-col gap-3.5 absolute top-28 right-10 w-80 pointer-events-auto">
        {/* Metric 1: Oil Pollution Level */}
        <div className="rounded-3xl bg-slate-900/85 border-2 border-slate-700/80 p-5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Độ Ô Nhiễm Dầu
            </span>
            <Biohazard
              className={`h-6 w-6 ${
                oilPollutionRemaining > 30 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-4xl font-black tracking-tight ${
                oilPollutionRemaining > 50
                  ? 'text-rose-400'
                  : oilPollutionRemaining > 0
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              {oilPollutionRemaining}%
            </span>
            <span className="text-sm font-bold text-slate-400">
              {oilPollutionRemaining === 0 ? 'Đã sạch hoàn toàn' : 'Váng dầu còn lại'}
            </span>
          </div>
        </div>

        {/* Metric 2: Bacteria Colony Activity */}
        <div className="rounded-3xl bg-slate-900/85 border-2 border-slate-700/80 p-5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Mật Độ Alcanivorax
            </span>
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-300">
            {bacteriaDensity}
          </div>
          <div className="mt-1 text-xs font-bold text-slate-400">
            {phase === 'polluted'
              ? 'Chưa thả chế phẩm sinh học'
              : phase === 'remediating'
              ? 'Nhân đôi nhanh khi có nguồn cacbon từ dầu'
              : 'Tự giảm số lượng khi hết nguồn dầu'}
          </div>
        </div>

        {/* Metric 3: CO2 & H2O Conversion */}
        <div className="rounded-3xl bg-slate-900/85 border-2 border-slate-700/80 p-5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              Sản Phẩm Chuyển Hóa
            </span>
            <div className="flex gap-1.5">
              <Wind className="h-5 w-5 text-sky-300" />
              <Droplets className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-1 text-3xl font-black text-sky-300">
            {co2Generated} <span className="text-lg font-bold">tấn CO₂ & H₂O</span>
          </div>
          <div className="mt-1 text-xs font-bold text-slate-400">
            Không để lại hóa chất độc hại thứ cấp
          </div>
        </div>
      </aside>

      {/* ================= EDUCATIONAL POPUP MODAL (SINH HỌC 10) ================= */}
      {showBioFacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-md">
          <div className="max-w-2xl rounded-3xl bg-slate-900 border-2 border-emerald-500/50 p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-amber-400" />
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Kiến Thức Trọng Tâm Sinh Học 10
                </h3>
              </div>
              <button
                onClick={() => setShowBioFacts(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-base font-extrabold text-slate-300 hover:bg-slate-700"
              >
                Đóng ✕
              </button>
            </div>

            <div className="space-y-4 text-base sm:text-lg font-medium text-slate-200 leading-relaxed">
              <p>
                <strong className="text-emerald-400 font-black">
                  1. Vi khuẩn Alcanivorax borkumensis là gì?
                </strong>
                <br />
                Là loài vi khuẩn biển hình que, dị dưỡng, có khả năng sử dụng{' '}
                <strong className="text-white">Hydrocarbon trong dầu mỏ</strong> làm nguồn
                cacbon và năng lượng duy nhất để sinh trưởng.
              </p>
              <p>
                <strong className="text-sky-400 font-black">
                  2. Cơ chế phân hủy dầu (Bioremediation):
                </strong>
                <br />
                Vi khuẩn tiết ra chất hoạt động bề mặt sinh học (biosurfactants) giúp chia
                nhỏ váng dầu thành các giọt vi mô, sau đó dùng hệ enzym{' '}
                <span className="italic text-amber-300">Alkane hydroxylase</span> bẻ gãy
                chuỗi Hydrocarbon thành <strong className="text-white">CO₂</strong> và{' '}
                <strong className="text-white">nước (H₂O)</strong>.
              </p>
              <p>
                <strong className="text-amber-400 font-black">
                  3. Ưu điểm vượt trội so với hóa chất:
                </strong>
                <br />
                Thân thiện với môi trường biển, chi phí thấp, không gây ô nhiễm thứ cấp;
                khi dầu hết, quần thể vi khuẩn tự động giảm về mức cân bằng tự nhiên.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM CONTROL DOCK & PROGRESS BAR ================= */}
      <footer className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 lg:px-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900/90 border-2 border-slate-700/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            {/* LEFT: Prominent Action Button */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {phase === 'polluted' && (
                <button
                  onClick={handleReleaseBacteria}
                  className="btn-release-glow flex items-center justify-center gap-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-7 py-4 text-xl sm:text-2xl font-black text-slate-950 shadow-xl transition-transform active:scale-95 hover:brightness-110"
                >
                  <Sparkles className="h-7 w-7 stroke-[2.5]" />
                  <span>THẢ VI KHUẨN ALCANIVORAX</span>
                </button>
              )}

              {phase === 'remediating' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPaused((p) => !p)}
                    className={`flex items-center gap-2.5 rounded-2xl px-6 py-4 text-lg sm:text-xl font-black transition-all ${
                      isPaused
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                        : 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-6 w-6 fill-current" />
                        <span>TIẾP TỤC PHÂN HỦY</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-6 w-6 fill-current" />
                        <span>TẠM DỪNG QUAN SÁT</span>
                      </>
                    )}
                  </button>

                  {/* Speed selector */}
                  <div className="flex items-center rounded-2xl bg-slate-800 p-1.5 border border-slate-700">
                    {[0.5, 1, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setSimSpeed(spd)}
                        className={`rounded-xl px-3 py-2 text-sm sm:text-base font-black transition-colors ${
                          simSpeed === spd
                            ? 'bg-sky-500 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'clean' && (
                <div className="flex items-center gap-3 rounded-2xl bg-sky-500/20 border-2 border-sky-400 px-6 py-3.5 text-sky-300">
                  <CheckCircle2 className="h-8 w-8 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-lg sm:text-xl font-black text-white">
                      HOÀN TẤT LÀM SẠCH 100%!
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-sky-300">
                      Nước biển đã phục hồi màu xanh trong tự nhiên
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-4 text-base sm:text-lg font-extrabold text-slate-200 transition-colors"
                title="Đặt lại mô phỏng (Phím R)"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Làm lại</span>
              </button>
            </div>

            {/* RIGHT: Sleek Pollution Removal Progress Bar & Interactive Scrubber */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400">
                    Tiến Độ Làm Sạch Ô Nhiễm Dầu (Bioremediation Progress)
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-slate-200">
                    {cleanPercentage === 0 && 'Chưa xử lý — Nước biển đen đặc váng dầu'}
                    {cleanPercentage > 0 &&
                      cleanPercentage < 100 &&
                      'Vi khuẩn đang chuyển hóa Hydrocarbon ➔ CO₂ + H₂O...'}
                    {cleanPercentage === 100 &&
                      'Đã loại bỏ hoàn toàn dầu tràn trên mặt biển!'}
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                  {cleanPercentage}%
                </div>
              </div>

              {/* Visual Progress Bar with Interactive Range Input */}
              <div className="relative h-6 w-full rounded-full bg-slate-950 border-2 border-slate-700 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 transition-all duration-150"
                  style={{ width: `${cleanPercentage}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={cleanPercentage}
                  onChange={handleManualScrub}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Kéo thanh trượt để tua nhanh/chậm quá trình làm sạch dầu"
                />
              </div>

              <div className="mt-1.5 flex justify-between text-xs font-extrabold text-slate-400">
                <span>0% (Tràn dầu đen đặc)</span>
                <span className="text-emerald-400">
                  Kéo thanh trượt bất kỳ lúc nào để minh họa từng bước
                </span>
                <span className="text-sky-400">100% (Biển xanh sạch)</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
