import React, { useMemo, forwardRef, useState, useEffect } from 'react';
import { differenceInWeeks, addWeeks, format } from 'date-fns';
import { cn } from '../utils';

const TOTAL_YEARS = 80;
const WEEKS_IN_YEAR = 52;
const TOTAL_WEEKS = TOTAL_YEARS * WEEKS_IN_YEAR;

const LifeGrid = forwardRef(({ birthDate, tasks, onSetWeekFocus, exportMode }, ref) => {
    // Live Date State
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        // Update the live date display every minute so it changes exactly at midnight without refreshing
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { weeksLived, weeksRemaining, totalWeeks, startOfLife } = useMemo(() => {
        if (!birthDate) return { weeksLived: 0, weeksRemaining: TOTAL_WEEKS, totalWeeks: TOTAL_WEEKS, startOfLife: new Date() };

        const start = new Date(birthDate);
        const now = new Date();

        let lived = differenceInWeeks(now, start);
        if (lived < 0) lived = 0;
        if (lived > TOTAL_WEEKS) lived = TOTAL_WEEKS;

        return { weeksLived: lived, weeksRemaining: TOTAL_WEEKS - lived, totalWeeks: TOTAL_WEEKS, startOfLife: start };
    }, [birthDate]);

    const weeksArray = useMemo(() => Array.from({ length: totalWeeks }, (_, i) => i), [totalWeeks]);

    return (
        <div
            className={cn(
                "flex flex-col items-center w-full mx-auto my-8 p-4 md:p-8 transition-all duration-300",
                exportMode === 'desktop' ? "max-w-[1920px] px-[10vw]" : "max-w-5xl"
            )}
            ref={ref}
        >
            {/* Header/Stats area */}
            <div className="w-full flex flex-col items-center mb-10 gap-6 md:gap-8 relative">

                {/* Top Row: Title, Live Date, Stats */}
                <div className="w-full flex flex-wrap justify-between items-center gap-y-6 gap-x-4">

                    {/* Left: Title */}
                    <div className="flex-1 min-w-[200px] flex justify-center xl:justify-start">
                        <h2 className="text-3xl font-bold tracking-tight text-textPrimary">Life Calendar</h2>
                    </div>

                    {/* Center: Live Date (Strictly Above Quote now) */}
                    <div className="shrink-0 flex flex-col items-center justify-center p-3 px-6 rounded-2xl bg-card border border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-0.5">Today</span>
                        <span className="text-lg md:text-xl font-semibold text-textPrimary whitespace-nowrap">
                            {format(currentDate, 'EEEE, MMMM do, yyyy')}
                        </span>
                    </div>

                    {/* Right: Stats */}
                    <div className="flex-1 min-w-[300px] flex gap-4 md:gap-6 justify-center xl:justify-end text-center shrink-0 overflow-x-auto pb-2 md:pb-0">
                        <div className="flex flex-col">
                            <span className="text-3xl font-light text-textPrimary">{weeksLived.toLocaleString()}</span>
                            <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-textSecondary">Weeks Lived</span>
                        </div>
                        <div className="w-px bg-zinc-800"></div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-light text-textPrimary">{weeksRemaining.toLocaleString()}</span>
                            <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-textSecondary">Weeks Left</span>
                        </div>

                        {/* Global Pending Tasks Stat */}
                        {(() => {
                            let totalPending = 0;
                            if (tasks) {
                                Object.values(tasks).forEach(weekTasks => {
                                    if (weekTasks) {
                                        Object.values(weekTasks).forEach(t => {
                                            if (typeof t === 'string' && t.trim() !== '') totalPending++;
                                            else if (t && t.text && t.text.trim() !== '' && !t.completed) totalPending++;
                                        });
                                    }
                                });
                            }

                            if (totalPending > 0) {
                                return (
                                    <>
                                        <div className="w-px bg-zinc-800"></div>
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-semibold text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">{totalPending.toLocaleString()}</span>
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-red-500/80">Pending Tasks</span>
                                        </div>
                                    </>
                                );
                            }
                            return null;
                        })()}

                    </div>
                </div>

                {/* Bottom Row: Calligraphy Quote (Strictly Below Date) */}
                <div className="w-full flex justify-center text-center px-4 mt-2 mb-2">
                    <p className="text-3xl md:text-5xl font-calligraphy tracking-wider text-zinc-300 drop-shadow-lg">
                        "Life is what happens to us while making other plans."
                    </p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 self-center md:self-start mb-6 text-xs text-textSecondary">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-lived shadow-[0_0_8px_rgba(255,255,255,0.2)]"></div>
                    <span>Lived</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-unlived border border-zinc-800/50"></div>
                    <span>Remaining</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-unlived flex items-center justify-center border border-zinc-800/50">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_4px_rgba(250,204,21,0.5)]"></div>
                    </div>
                    <span>Pending Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-unlived flex items-center justify-center border border-zinc-800/50">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.5)]"></div>
                    </div>
                    <span>Completed</span>
                </div>
            </div>

            {/* Grid */}
            <div
                className={cn(
                    "grid w-full p-6 md:p-10 rounded-3xl bg-card shadow-2xl transition-all duration-300",
                    exportMode === 'none' && "border border-zinc-800/50",
                    exportMode === 'mobile' ? "gap-[2px]" : (exportMode === 'desktop' ? "gap-[6px]" : "gap-[3px] md:gap-1")
                )}
                style={{
                    gridTemplateColumns: exportMode === 'desktop'
                        ? `repeat(auto-fill, minmax(14px, 1fr))`
                        : (exportMode === 'mobile' ? `repeat(auto-fill, minmax(6px, 1fr))` : `repeat(auto-fill, minmax(10px, 1fr))`),
                }}
            >
                <div className={cn(
                    "col-span-full flex flex-wrap justify-center",
                    exportMode === 'mobile' ? "gap-[2px]" : (exportMode === 'desktop' ? "gap-[6px]" : "gap-[3px] md:gap-1")
                )}>
                    {weeksArray.map((weekIndex) => {
                        const isLived = weekIndex < weeksLived;
                        const isCurrentYear = Math.floor(weekIndex / 52) === Math.floor(weeksLived / 52);
                        const weekTasks = tasks[weekIndex];
                        const hasTasks = weekTasks && Object.keys(weekTasks).length > 0;

                        let allCompleted = false;
                        if (hasTasks) {
                            const taskValues = Object.values(weekTasks);
                            allCompleted = taskValues.every(t => typeof t === 'object' && t.completed === true);
                        }

                        let hoverDateSubtitle = '';
                        if (birthDate) {
                            const thisWeekStart = addWeeks(startOfLife, weekIndex);
                            hoverDateSubtitle = ` (${format(thisWeekStart, 'MMM yyyy')})`;
                        }

                        return (
                            <button
                                key={weekIndex}
                                onClick={() => onSetWeekFocus(weekIndex)}
                                className={cn(
                                    "relative group flex items-center justify-center outline-none transition-all duration-300",
                                    "hover:scale-125 hover:z-10 focus-visible:ring-2 focus-visible:ring-accent",
                                    isLived
                                        ? "bg-lived shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                        : "bg-unlived border border-zinc-800/50",
                                    !isLived && isCurrentYear && "opacity-60",
                                    exportMode === 'desktop'
                                        ? "w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] rounded-[3px]"
                                        : (exportMode === 'mobile'
                                            ? "w-[6px] h-[6px] rounded-[1px]"
                                            : "w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-sm sm:rounded-[3px]")
                                )}
                                title={`Week ${weekIndex + 1}${hoverDateSubtitle}${hasTasks ? (allCompleted ? ' - All tasks complete!' : ' - Pending tasks') : ''}`}
                            >
                                {hasTasks && (
                                    <div className={cn(
                                        "absolute rounded-full transition-colors",
                                        allCompleted ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" : "bg-yellow-400 shadow-[0_0_4px_rgba(250,204,21,0.5)]",
                                        exportMode === 'mobile' ? "w-0.5 h-0.5" : "w-1 h-1 md:w-1.5 md:h-1.5"
                                    )} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default LifeGrid;
