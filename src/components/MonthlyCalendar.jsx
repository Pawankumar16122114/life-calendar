import React, { useState, useEffect, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSunday,
    isToday,
    addMonths,
    subMonths,
    isSameDay
} from 'date-fns';
import Holidays from 'date-holidays';
import { cn } from '../utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthlyCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date()); // for "today" highlighting
    const [currentMonthView, setCurrentMonthView] = useState(startOfMonth(new Date())); // for navigation

    const [customEvents, setCustomEvents] = useState({}); // { 'yyyy-MM-dd': ['event1', 'event2'] }
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEventDate, setNewEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [newEventName, setNewEventName] = useState('');

    // Load custom events with migration from string to array
    useEffect(() => {
        const saved = localStorage.getItem('lifeCalendarCustomEvents');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const migrated = {};
                for (const [date, events] of Object.entries(parsed)) {
                    if (typeof events === 'string') {
                        migrated[date] = [events]; // Migrate old single string format to array
                    } else if (Array.isArray(events)) {
                        migrated[date] = events;
                    }
                }
                setCustomEvents(migrated);
            } catch (e) {
                console.error("Failed to parse custom events", e);
            }
        }
    }, []);

    // Save custom events
    const saveCustomEvent = (e) => {
        e.preventDefault();
        if (!newEventDate || !newEventName.trim()) return;

        const dateStr = newEventDate;
        const currentDayEvents = customEvents[dateStr] || [];
        const updatedEvents = {
            ...customEvents,
            [dateStr]: [...currentDayEvents, newEventName.trim()]
        };

        setCustomEvents(updatedEvents);
        localStorage.setItem('lifeCalendarCustomEvents', JSON.stringify(updatedEvents));

        setIsAddingEvent(false);
        setNewEventName('');
    };

    // Set up holidays for India (can be customized)
    const hd = useMemo(() => new Holidays('IN'), []);

    // Update timer to ensure the "today" highlight rolls over exactly at midnight
    useEffect(() => {
        const timer = setInterval(() => setCurrentDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const monthStart = startOfMonth(currentMonthView);
    const monthEnd = endOfMonth(monthStart);

    // We want the grid to start on the Sunday on or before the 1st
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 = Sunday
    // Grid ends on the Saturday on or after the end of month
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Current year holidays map for quick O(1) lookup in the currently viewed year
    const currentYearHolidays = useMemo(() => {
        const year = currentMonthView.getFullYear();
        const list = hd.getHolidays(year);
        const map = new Map();
        list.forEach(holiday => {
            // Store by date string "YYYY-MM-DD"
            const dateStr = format(new Date(holiday.date), 'yyyy-MM-dd');
            map.set(dateStr, holiday.name);
        });
        return map;
    }, [hd, currentMonthView]);

    const handlePrevMonth = () => setCurrentMonthView(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonthView(prev => addMonths(prev, 1));
    const handleResetMonth = () => setCurrentMonthView(startOfMonth(new Date()));

    const isViewingCurrentRealMonth = isSameMonth(currentMonthView, currentDate);

    return (
        <div className="w-full h-full flex flex-col bg-card border border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 relative">

            {/* Header / Month Navigation */}
            <div className="flex flex-col items-center mb-6 relative">
                <div className="flex items-center justify-between w-full mb-2">
                    <button onClick={handlePrevMonth} className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex flex-col items-center cursor-pointer" onClick={handleResetMonth} title="Return to current month">
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-textPrimary capitalize">
                            {format(currentMonthView, 'MMMM')}
                        </h3>
                        <span className="text-lg md:text-xl font-medium text-textSecondary uppercase tracking-widest mt-0.5 flex gap-2 items-center">
                            {format(currentMonthView, 'yyyy')}
                            {!isViewingCurrentRealMonth && (
                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" title="Not viewing current month"></div>
                            )}
                        </span>
                    </div>

                    <button onClick={handleNextMonth} className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-full transition-colors">
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Add Event Toggle Button */}
                {!isAddingEvent && (
                    <button
                        onClick={() => {
                            // Default new event date to the viewed month (e.g. 1st of viewed month, or today if viewing current month)
                            setNewEventDate(isViewingCurrentRealMonth ? format(currentDate, 'yyyy-MM-dd') : format(monthStart, 'yyyy-MM-dd'));
                            setIsAddingEvent(true);
                        }}
                        className="mt-2 text-xs font-semibold text-green-400 border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 px-3 py-1.5 rounded-full transition-colors flex items-center justify-center gap-1"
                    >
                        <span>+</span> Add Event
                    </button>
                )}

                {/* Add Event Form Inline */}
                {isAddingEvent && (
                    <form onSubmit={saveCustomEvent} className="absolute z-[100] top-full left-1/2 -translate-x-1/2 mt-2 bg-[#09090b] border border-zinc-600 p-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col gap-2 min-w-[220px]">
                        <input
                            type="date"
                            required
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="bg-zinc-800 text-sm text-textPrimary rounded px-2 py-1.5 w-full outline-none border border-transparent focus:border-green-500"
                        />
                        <input
                            type="text"
                            required
                            placeholder="Event name (e.g. Birthday)"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            className="bg-zinc-800 text-sm text-textPrimary p-1.5 px-2 rounded w-full outline-none border border-transparent focus:border-green-500 placeholder:text-zinc-500"
                        />
                        <div className="flex gap-2 mt-1">
                            <button type="button" onClick={() => setIsAddingEvent(false)} className="flex-1 text-xs py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-textSecondary transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 text-xs py-1.5 rounded bg-green-600 hover:bg-green-500 text-white font-medium transition-colors">
                                Save
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 mb-2 border-b border-zinc-800/50 pb-2">
                {weekDays.map((day, i) => (
                    <div
                        key={day}
                        className={cn(
                            "text-center text-xs font-semibold uppercase tracking-wider",
                            i === 0 ? "text-red-400" : "text-textSecondary" // highlight Sunday header
                        )}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 flex-grow">
                {calendarDays.map((day) => {
                    // Check against current month being viewed, not current real date
                    const isMonthViewed = isSameMonth(day, monthStart);
                    const isDayToday = isSameDay(day, currentDate);
                    const isSun = isSunday(day);

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const holidayName = currentYearHolidays.get(dateStr);
                    const isHoliday = !!holidayName;

                    const dayCustomEvents = customEvents[dateStr] || [];
                    const isCustomEvent = dayCustomEvents.length > 0;

                    // A day needs coloring if it's Sunday, a holiday, or a custom event
                    // Priority: Custom Event (Green) -> Holiday/Sunday (Red) -> Default
                    const isRed = (isSun || isHoliday) && !isCustomEvent;
                    const isGreen = isCustomEvent;

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "flex flex-col items-center justify-start p-1 md:p-2 rounded-lg transition-colors border relative overflow-hidden",
                                // Visual Dimming for outside-month days
                                !isMonthViewed ? "opacity-30 border-transparent" : "border-zinc-800/20 bg-zinc-900/30",
                                // Highlight exact 'today' regardless of month view
                                isDayToday ? "bg-zinc-800 border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-zinc-600" : ""
                            )}
                        >
                            {/* Inner Green Glow if custom event */}
                            {isCustomEvent && isMonthViewed && (
                                <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />
                            )}

                            <div
                                className={cn(
                                    "text-sm md:text-base md:mt-1 font-medium relative z-10",
                                    isGreen ? "text-green-400 font-bold" : (isRed ? "text-red-400 font-semibold" : "text-textPrimary")
                                )}
                            >
                                {format(day, 'd')}
                            </div>

                            {/* Multiple Custom Event Names */}
                            {isCustomEvent && isMonthViewed ? (
                                <div className="text-[9px] md:text-[10px] leading-tight text-center text-green-400/90 mt-1 px-0.5 w-full relative z-10 font-medium flex flex-col gap-0.5">
                                    {dayCustomEvents.map((evtName, idx) => (
                                        <span key={idx} className="block truncate w-full">{evtName}</span>
                                    ))}
                                </div>
                            ) : (
                                /* Holiday Name */
                                isHoliday && isMonthViewed && (
                                    <div className="text-[9px] md:text-[10px] leading-tight text-center text-red-400/80 mt-1 px-0.5 break-words line-clamp-2 w-full relative z-10">
                                        {holidayName}
                                    </div>
                                )
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Event List Section (Updates dynamically based on viewed month) */}
            {(() => {
                const monthEvents = [];

                // Gather holidays and custom events for the viewed month
                calendarDays.forEach(day => {
                    if (isSameMonth(day, monthStart)) {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const holidayName = currentYearHolidays.get(dateStr);
                        const dayCustomEvents = customEvents[dateStr] || [];

                        // Push all custom events for this day
                        dayCustomEvents.forEach(evtName => {
                            monthEvents.push({ date: day, name: evtName, type: 'custom' });
                        });

                        // Push holiday if it exists
                        if (holidayName) {
                            monthEvents.push({ date: day, name: holidayName, type: 'holiday' });
                        }
                    }
                });

                if (monthEvents.length === 0) return null;

                // Title updates based on navigation
                const listTitle = isViewingCurrentRealMonth ? "This Month's Events" : `${format(monthStart, 'MMMM yyyy')} Events`;

                return (
                    <div className="mt-6 pt-4 border-t border-zinc-800/50 flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1 sticky top-0 bg-card z-20">
                            {listTitle}
                        </h4>
                        {monthEvents.map((evt, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-2 rounded bg-zinc-900/40 border border-zinc-800/50">
                                <div className={cn(
                                    "flex flex-col items-center justify-center min-w-[40px] px-2 py-1 rounded",
                                    evt.type === 'custom' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                )}>
                                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">{format(evt.date, 'MMM')}</span>
                                    <span className="text-sm font-black leading-none mt-0.5">{format(evt.date, 'd')}</span>
                                </div>
                                <div className="flex flex-col justify-center py-0.5">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        evt.type === 'custom' ? "text-green-400/90" : "text-textPrimary"
                                    )}>
                                        {evt.name}
                                    </span>
                                    <span className="text-[10px] text-textSecondary flex items-center gap-1">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", evt.type === 'custom' ? "bg-green-500" : "bg-red-500")} />
                                        {evt.type === 'custom' ? 'Custom Event' : 'National Holiday'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}
