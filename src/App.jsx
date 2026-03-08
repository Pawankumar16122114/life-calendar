import React, { useState, useEffect, useRef, useMemo } from 'react';
import SetupScreen from './components/SetupScreen';
import LifeGrid from './components/LifeGrid';
import WeekDetailModal from './components/WeekDetailModal';
import MonthlyCalendar from './components/MonthlyCalendar';
import { Download, RefreshCw, Smartphone, Monitor, AlertCircle, Bell, Image as ImageIcon, X } from 'lucide-react';
import { differenceInWeeks, format } from 'date-fns';
import html2canvas from 'html2canvas';

const playMinimalChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.5);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 3);
  } catch (e) {
    console.error("Audio chime failed to play:", e);
  }
};

function App() {
  const [birthDate, setBirthDate] = useState(null);
  const [tasks, setTasks] = useState({});
  const [focusedWeek, setFocusedWeek] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState('none');
  const [customBg, setCustomBg] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const savedDate = localStorage.getItem('lifeCalendarBirthdate');
    if (savedDate) setBirthDate(savedDate);

    const savedBg = localStorage.getItem('lifeCalendarCustomBg');
    if (savedBg) setCustomBg(savedBg);

    const savedTasks = localStorage.getItem('lifeCalendarTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleSaveDate = (date) => {
    localStorage.setItem('lifeCalendarBirthdate', date);
    setBirthDate(date);
    requestNotificationPermission();
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to change your birthdate? Your tasks will be preserved.")) {
      localStorage.removeItem('lifeCalendarBirthdate');
      setBirthDate(null);
    }
  };

  const handleSaveTasks = (weekIndex, weekTasks) => {
    const newTasks = { ...tasks, [weekIndex]: weekTasks };
    if (Object.keys(weekTasks).length === 0) {
      delete newTasks[weekIndex];
    }

    setTasks(newTasks);
    localStorage.setItem('lifeCalendarTasks', JSON.stringify(newTasks));
    setFocusedWeek(null);

    if (notificationPermission === 'default') {
      requestNotificationPermission();
    }
  };

  const triggerExport = async (mode) => {
    if (!gridRef.current) return;

    setExportMode(mode);
    setIsExporting(true);

    try {
      await new Promise(r => setTimeout(r, 600));

      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: customBg ? null : '#09090b',
        scale: mode === 'desktop' ? 1.5 : 2,
        windowWidth: mode === 'desktop' ? 1920 : 1080,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedGrid = clonedDoc.querySelector('[data-html2canvas-ignore]');
          if (clonedGrid) clonedGrid.style.display = 'none';
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `life-calendar-${mode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export wallpaper", err);
      alert("Failed to export wallpaper. Please try again.");
    } finally {
      setIsExporting(false);
      setExportMode('none');
    }
  };

  const { currentWeekIndex, pendingTasksCount } = useMemo(() => {
    if (!birthDate) return { currentWeekIndex: -1, pendingTasksCount: 0 };

    const start = new Date(birthDate);
    const now = new Date();
    const weekIdx = Math.max(0, differenceInWeeks(now, start));

    const currentTasks = tasks[weekIdx];
    let pending = 0;
    if (currentTasks) {
      Object.values(currentTasks).forEach(t => {
        if (typeof t === 'string' && t.trim() !== '') pending++;
        else if (t && t.text && t.text.trim() !== '' && !t.completed) pending++;
      });
    }

    return { currentWeekIndex: weekIdx, pendingTasksCount: pending };
  }, [birthDate, tasks]);

  useEffect(() => {
    if (!birthDate || pendingTasksCount === 0 || notificationPermission !== 'granted') return;

    const checkTimeForReminder = () => {
      const now = new Date();
      if (now.getHours() === 19) {
        const todayStr = format(now, 'yyyy-MM-dd');
        const lastFired = localStorage.getItem('lifeCalendarLastAlert');
        if (lastFired !== todayStr) {
          playMinimalChime();
          new Notification("Life Calendar Reminder", {
            body: `You have ${pendingTasksCount} pending tasks to finish today. There are 5 hours left in the day.`,
            icon: '/vite.svg'
          });
          localStorage.setItem('lifeCalendarLastAlert', todayStr);
        }
      }
    };

    checkTimeForReminder();
    const timerId = setInterval(checkTimeForReminder, 60000);
    return () => clearInterval(timerId);
  }, [birthDate, pendingTasksCount, notificationPermission]);


  if (!birthDate) {
    return <SetupScreen onSave={handleSaveDate} />;
  }

  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setCustomBg(result);
        try {
          localStorage.setItem('lifeCalendarCustomBg', result);
        } catch (err) {
          console.error("Image too large to save to cache", err);
          alert("Image is too large to permanently save, but it will be used for your current session.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBg = () => {
    setCustomBg(null);
    localStorage.removeItem('lifeCalendarCustomBg');
  };

  return (
    <div
      className="min-h-screen bg-background text-textPrimary selection:bg-accent/30 flex flex-col items-center overflow-x-hidden relative bg-cover bg-center bg-no-repeat"
      style={customBg ? { backgroundImage: `linear-gradient(rgba(9, 9, 11, 0.7), rgba(9, 9, 11, 0.9)), url(${customBg})` } : {}}
      ref={gridRef}
    >

      {/* Reminder Banner */}
      {pendingTasksCount > 0 && exportMode === 'none' && (
        <div
          className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-300 py-3 px-4 flex justify-between items-center gap-3 transition-colors cursor-pointer hover:bg-yellow-500/20"
          onClick={() => setFocusedWeek(currentWeekIndex)}
          title="Click to view this week's tasks"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">
              You have {pendingTasksCount} pending task{pendingTasksCount !== 1 ? 's' : ''} for the current week. Let's get it done.
            </span>
          </div>
          {notificationPermission !== 'granted' && (
            <button
              onClick={(e) => { e.stopPropagation(); requestNotificationPermission(); }}
              className="text-xs flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded hover:bg-yellow-500/30 transition-colors"
            >
              <Bell size={12} /> Enable Alerts
            </button>
          )}
        </div>
      )}

      {/* Tool bar floating at bottom */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-card/80 backdrop-blur-md px-4 sm:px-6 py-3 rounded-full border border-zinc-800 shadow-2xl z-50 transition-opacity duration-300 ${exportMode !== 'none' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        data-html2canvas-ignore="true"
      >
        <button
          onClick={() => triggerExport('mobile')}
          disabled={isExporting}
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-textPrimary hover:text-accent transition-colors disabled:opacity-50"
          title="Export optimized for Mobile Wallpaper"
        >
          <Smartphone size={18} />
          <span className="hidden sm:inline">{isExporting && exportMode === 'mobile' ? 'Exporting...' : 'Mobile'}</span>
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-1 sm:mx-2"></div>
        <button
          onClick={() => triggerExport('desktop')}
          disabled={isExporting}
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-textPrimary hover:text-accent transition-colors disabled:opacity-50"
          title="Export optimized for Desktop Wallpaper"
        >
          <Monitor size={18} />
          <span className="hidden sm:inline">{isExporting && exportMode === 'desktop' ? 'Exporting...' : 'Desktop'}</span>
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-1 sm:mx-2"></div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm font-medium text-textSecondary hover:text-red-400 transition-colors"
          title="Reset Birthdate"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Main Content Layout: Side-by-Side on Desktop, Stacked on Mobile */}
      <main className={`w-full max-w-[1920px] pb-32 flex flex-col xl:flex-row justify-center items-start gap-8 xl:gap-12 mt-4 px-4 xl:px-12 transition-all duration-300 ${exportMode !== 'none' ? 'justify-center items-center' : ''}`}>

        {/* Left Side: Life Grid */}
        <div className={`w-full ${exportMode === 'none' ? 'xl:w-2/3' : 'xl:w-full'} flex justify-center transition-all duration-300`}>
          <LifeGrid
            birthDate={birthDate}
            tasks={tasks}
            onSetWeekFocus={setFocusedWeek}
            exportMode={exportMode}
          />
        </div>

        {/* Right Side: Monthly Calendar (Now always rendered during export) */}
        <div className="w-full xl:w-1/3 xl:sticky xl:top-8 mt-12 xl:mt-[380px] flex justify-center">
          <MonthlyCalendar />
        </div>

      </main>

      {/* Week Detail Modal */}
      {
        focusedWeek !== null && (
          <WeekDetailModal
            weekIndex={focusedWeek}
            birthDate={birthDate}
            initialTasks={tasks[focusedWeek]}
            onClose={() => setFocusedWeek(null)}
            onSave={handleSaveTasks}
          />
        )
      }

      {/* Customize Background Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2" data-html2canvas-ignore="true">
        {customBg && (
          <button
            onClick={removeBg}
            className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center transition-colors shadow-lg backdrop-blur-md"
            title="Remove Background"
          >
            <X size={18} />
          </button>
        )}
        <label className="flex items-center gap-2 bg-card/80 backdrop-blur-md px-4 py-2 sm:py-3 rounded-full border border-zinc-800 shadow-2xl hover:bg-zinc-800 transition-colors cursor-pointer text-sm font-medium text-textPrimary hover:text-accent">
          <ImageIcon size={18} />
          <span className="hidden sm:inline">Customize Background</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBgUpload}
          />
        </label>
      </div>
    </div >
  );
}

export default App;
