import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, Circle } from 'lucide-react';
import { addWeeks, addDays, format } from 'date-fns';
import { cn } from '../utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekDetailModal({ weekIndex, initialTasks, birthDate, onClose, onSave }) {
    const [tasks, setTasks] = useState(() => {
        // Migration from old string format just in case
        const parsed = { ...initialTasks };
        Object.keys(parsed).forEach(k => {
            if (typeof parsed[k] === 'string') {
                parsed[k] = { text: parsed[k], completed: false };
            }
        });
        return parsed;
    });

    // Calculate Week Date Range based on birthDate and weekIndex
    const { weekStart, weekEnd, daysInfo } = useMemo(() => {
        if (!birthDate) return { weekStart: new Date(), weekEnd: new Date(), daysInfo: [] };

        // We assume the user's birthdate is "Day 0", which acts as the 'Monday' of their first week.
        const startOfLife = new Date(birthDate);
        const thisWeekStart = addWeeks(startOfLife, weekIndex);
        const thisWeekEnd = addDays(thisWeekStart, 6);

        const info = DAYS.map((dayName, idx) => {
            const specificDate = addDays(thisWeekStart, idx);
            return {
                name: dayName,
                dateFormatted: format(specificDate, 'MMM d, yyyy') // e.g., "May 10, 2026"
            };
        });

        return { weekStart: thisWeekStart, weekEnd: thisWeekEnd, daysInfo: info };
    }, [birthDate, weekIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleTextChange = (dayIndex, value) => {
        setTasks(prev => ({
            ...prev,
            [dayIndex]: { ...(prev[dayIndex] || { completed: false }), text: value }
        }));
    };

    const handleToggleCompleted = (dayIndex) => {
        setTasks(prev => {
            const current = prev[dayIndex] || { text: '', completed: false };
            if (!current.text.trim()) return prev;
            return {
                ...prev,
                [dayIndex]: { ...current, completed: !current.completed }
            };
        });
    };

    const handleSave = () => {
        const cleaned = {};
        Object.entries(tasks).forEach(([dayIdx, taskObj]) => {
            if (taskObj && taskObj.text && taskObj.text.trim() !== '') {
                cleaned[dayIdx] = taskObj;
            }
        });
        onSave(weekIndex, cleaned);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div
                className="relative w-full max-w-lg bg-card border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-900/50">
                    <div>
                        <h3 className="text-lg font-semibold text-textPrimary">Week {weekIndex + 1}</h3>
                        <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5">
                            <span>{format(weekStart, 'MMM d, yyyy')}</span>
                            <span>-</span>
                            <span>{format(weekEnd, 'MMM d, yyyy')}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-textSecondary hover:text-textPrimary bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[60vh] flex flex-col gap-4">
                    {daysInfo.map((dayData, index) => {
                        const currentTask = tasks[index];
                        const hasText = currentTask && currentTask.text.trim() !== '';
                        const isCompleted = currentTask && currentTask.completed;

                        return (
                            <div key={index} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-end px-1 ml-1 mb-0.5 border-b border-zinc-800/50 pb-1">
                                    <span className="text-xs font-semibold text-textPrimary tracking-wide uppercase">{dayData.name}</span>
                                    <span className="text-[10px] text-textSecondary bg-zinc-800/40 px-1.5 py-0.5 rounded">{dayData.dateFormatted}</span>
                                </div>

                                <div className="relative flex items-center">
                                    <button
                                        onClick={() => handleToggleCompleted(index)}
                                        className={cn(
                                            "absolute left-3 transition-colors z-10",
                                            isCompleted ? "text-green-500" : "text-zinc-500 hover:text-zinc-400",
                                            !hasText && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={!hasText}
                                    >
                                        {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="No tasks assigned..."
                                        value={currentTask?.text || ''}
                                        onChange={(e) => handleTextChange(index, e.target.value)}
                                        className={cn(
                                            "w-full bg-background border border-zinc-800 rounded-lg py-3 pr-3 pl-10 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-zinc-600",
                                            isCompleted ? "text-zinc-500 line-through bg-zinc-900/40 border-zinc-900" : "text-textPrimary"
                                        )}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-textPrimary text-background rounded-lg text-sm font-semibold hover:bg-zinc-200 active:bg-zinc-300 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    >
                        Save Tasks
                    </button>
                </div>
            </div>
        </div>
    );
}
