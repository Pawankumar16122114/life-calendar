import React, { useState } from 'react';

export default function SetupScreen({ onSave }) {
    const [date, setDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (date) {
            onSave(date);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-2xl border border-zinc-800">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-textPrimary mb-2">Life Calendar</h1>
                    <p className="text-sm text-textSecondary">
                        Visualizing 80 years of life in weeks. Time is finite. Let's make it count.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="birthdate" className="text-sm font-medium text-textSecondary">
                            When were you born?
                        </label>
                        <input
                            type="date"
                            id="birthdate"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="rounded-lg bg-background p-3 text-textPrimary border border-zinc-800 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-textPrimary py-3 font-semibold text-background transition-colors hover:bg-zinc-200 active:bg-zinc-300"
                    >
                        Generate Calendar
                    </button>
                </form>
            </div>
        </div>
    );
}
