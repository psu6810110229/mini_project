import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface ThaiDateTimePickerProps {
    value: string; // ISO datetime-local format: "2026-01-12T19:01"
    onChange: (value: string) => void;
    label: string;
    minDate?: Date;
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export default function ThaiDateTimePicker({ value, onChange, label, minDate }: ThaiDateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse current value
    const currentDate = value ? new Date(value) : new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    useEffect(() => {
        if (value) setViewDate(new Date(value));
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Convert to Buddhist Era
    const toBE = (year: number) => year + 543;

    // Format display
    const formatDisplay = () => {
        if (!value) return 'เลือกวันและเวลา';
        return `${currentDay} ${THAI_MONTHS[currentMonth]} ${toBE(currentYear)} ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} น.`;
    };

    // Generate calendar days
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const generateCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days: (number | null)[] = [];

        // Empty days before first day
        for (let i = 0; i < firstDay; i++) days.push(null);
        // Days of month
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    };

    // Handle date selection
    const selectDate = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, currentHour, currentMinute);
        updateValue(newDate);
    };

    // Handle time change
    const setHour = (h: number) => {
        const newDate = new Date(currentYear, currentMonth, currentDay, h, currentMinute);
        updateValue(newDate);
    };

    const setMinute = (m: number) => {
        const newDate = new Date(currentYear, currentMonth, currentDay, currentHour, m);
        updateValue(newDate);
    };

    const updateValue = (date: Date) => {
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        onChange(iso);
    };

    // Navigate months
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    // Quick select options
    const selectPreset = (days: number) => {
        const now = new Date();
        now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30); // Round to nearest 30min
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        updateValue(future);
        setIsOpen(false);
    };

    const isToday = (day: number) => {
        const today = new Date();
        return viewDate.getFullYear() === today.getFullYear() &&
            viewDate.getMonth() === today.getMonth() &&
            day === today.getDate();
    };

    const isSelected = (day: number) => {
        return viewDate.getFullYear() === currentYear &&
            viewDate.getMonth() === currentMonth &&
            day === currentDay;
    };

    const isPast = (day: number) => {
        if (!minDate) return false;
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return checkDate < minDate;
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-xs text-white/50 mb-2 uppercase">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm text-left flex items-center gap-2 hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="flex-1">{formatDisplay()}</span>
            </button>

            {isOpen && (
                <div className="absolute z-[9999] bottom-full mb-2 left-0 w-72 backdrop-blur-2xl bg-slate-800/95 border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                    {/* Quick Presets */}
                    <div className="p-3 border-b border-white/10 flex gap-2 flex-wrap">
                        <button onClick={() => selectPreset(1)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/30">+1 วัน</button>
                        <button onClick={() => selectPreset(3)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/30">+3 วัน</button>
                        <button onClick={() => selectPreset(7)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/30">+7 วัน</button>
                        <button onClick={() => selectPreset(14)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium hover:bg-blue-500/30">+14 วัน</button>
                    </div>

                    {/* Month/Year Header */}
                    <div className="flex items-center justify-between p-3 border-b border-white/10">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-white/70" />
                        </button>
                        <span className="text-white font-semibold">
                            {THAI_MONTHS[viewDate.getMonth()]} {toBE(viewDate.getFullYear())}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-white/70" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-3">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {THAI_DAYS.map(d => (
                                <div key={d} className="text-center text-xs text-white/40 font-medium py-1">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {generateCalendar().map((day, i) => (
                                <button
                                    key={i}
                                    onClick={() => day && !isPast(day) && selectDate(day)}
                                    disabled={!day || isPast(day)}
                                    className={`h-8 rounded-lg text-sm font-medium transition-all
                                        ${!day ? 'invisible' : ''}
                                        ${isPast(day) ? 'text-white/20 cursor-not-allowed' : 'hover:bg-white/10'}
                                        ${isSelected(day) ? 'bg-blue-500 text-white' : ''}
                                        ${isToday(day) && !isSelected(day) ? 'ring-1 ring-blue-400 text-blue-400' : 'text-white/80'}
                                    `}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Picker */}
                    <div className="p-3 border-t border-white/10 flex items-center gap-3">
                        <Clock className="w-4 h-4 text-white/50" />
                        <select
                            value={currentHour}
                            onChange={(e) => setHour(parseInt(e.target.value))}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                            style={{ colorScheme: 'dark' }}
                        >
                            {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                            ))}
                        </select>
                        <span className="text-white/50">:</span>
                        <select
                            value={currentMinute}
                            onChange={(e) => setMinute(parseInt(e.target.value))}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                            style={{ colorScheme: 'dark' }}
                        >
                            {[0, 15, 30, 45].map(m => (
                                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                        </select>
                        <span className="text-white/50 text-sm">น.</span>
                    </div>

                    {/* Done Button */}
                    <div className="p-3 border-t border-white/10">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
