import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';

interface ThaiDateTimePickerProps {
    value: string; // ISO datetime-local format: "2026-01-12T19:01"
    onChange: (value: string) => void;
    label: string;
    minDate?: Date; // Should act as a floor for selection
}

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

// Custom Time Select Component to prevent native dropdown issues
const TimeSelect = ({ value, options, onChange, suffix, disabled = false }: { value: number, options: number[], onChange: (v: number) => void, suffix?: string, disabled?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`bg-slate-700 border border-white/20 rounded-lg px-3 py-2 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 min-w-[80px] justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span>{String(value).padStart(2, '0')}</span>
                <ChevronDown className="w-4 h-4 text-white/50" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-slate-700 border border-white/20 rounded-lg shadow-xl z-50">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-600 transition-colors ${value === opt ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-white'}`}
                        >
                            {String(opt).padStart(2, '0')} {suffix}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function ThaiDateTimePicker({ value, onChange, label, minDate }: ThaiDateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());

    // Parse current value
    const currentDate = value ? new Date(value) : new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    useEffect(() => {
        if (value) setViewDate(new Date(value));
        else if (minDate) setViewDate(new Date(minDate));
    }, [value, minDate]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

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

        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    };

    // Helper: Compare dates ignoring time
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    // Validate if current selection is valid against minDate, if not adjust it
    const validateAndAdjust = (newDate: Date) => {
        if (minDate && newDate < minDate) {
            // If selected time is before minDate, force it to minDate's time (plus a buffer? usually exact minDate or +something)
            // But usually we just let user fix it, OR auto-fix. 
            // Better to prevent selecting invalid dates.
            // But if user picks SAME DAY, we must ensure Time >= minDate Time.
            return newDate;
        }
        return newDate;
    };

    // Handle date selection
    const selectDate = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, currentHour, currentMinute);

        // If we select a day that makes the current time invalid (e.g. past), adjust time?
        // Logic: if selected day == minDate day, ensure time >= minDate time.
        if (minDate && isSameDay(newDate, minDate)) {
            if (newDate < minDate) {
                // Auto-adjust to minDate time if current time is less
                newDate.setHours(minDate.getHours());
                newDate.setMinutes(Math.ceil(minDate.getMinutes() / 10) * 10);
            }
        }

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
        // Construct date to check at end of day to allow selecting "minDate" day
        const checkDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 23, 59, 59);
        return checkDate < minDate;
    };

    // Determine available hours based on minDate
    const getAvailableHours = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        if (minDate && isSameDay(currentDate, minDate)) {
            const minH = minDate.getHours();
            const minM = minDate.getMinutes();
            // If minutes >= 50, no valid minutes left in this hour (since we use 10min steps and enforce strict >), so start from next hour
            if (minM >= 50) {
                return hours.filter(h => h > minH);
            }
            return hours.filter(h => h >= minH);
        }
        return hours;
    };

    // Determine available minutes based on minDate
    const getAvailableMinutes = () => {
        const minutes = [0, 10, 20, 30, 40, 50];
        if (minDate && isSameDay(currentDate, minDate) && currentHour === minDate.getHours()) {
            // Strictly greater than minDate minutes
            return minutes.filter(m => m > minDate.getMinutes());
        }
        return minutes;
    };

    // Ensure state validity when hours/minutes change availability
    useEffect(() => {
        if (minDate && isSameDay(currentDate, minDate)) {
            const validHours = getAvailableHours();
            const validMinutes = getAvailableMinutes();

            // If current hour is not valid, jump to first valid hour
            if (validHours.length > 0 && !validHours.includes(currentHour)) {
                const nextHour = validHours[0];
                // Reset minute to 0 or appropriate start
                setHour(nextHour);
                // If we jumped hour, minutes usually reset to 0 unless it's the minDate hour again (which logic handles)
                if (nextHour > minDate.getHours()) {
                    setMinute(0);
                }
            } else if (validHours.includes(currentHour)) {
                // If current hour is valid but minute is not (e.g. minDate=10:30, current=10:30, valid > 30)
                if (validMinutes.length > 0 && !validMinutes.includes(currentMinute)) {
                    setMinute(validMinutes[0]);
                }
            }
        }
    }, [currentHour, currentDay, minDate]); // Check validity when time context changes

    const handleConfirm = () => {
        // Final validation before confirming
        if (!value) {
            updateValue(minDate || new Date());
        } else if (minDate && new Date(value) <= minDate) {
            // If somehow invalid, bump it
            const d = new Date(value);
            // Logic to auto-fix? Just ensure it's robust. 
            // Ideally UI prevents this, but safety check:
            const validMinutes = getAvailableMinutes();
            if (validMinutes.length > 0) d.setMinutes(validMinutes[0]);
            else {
                // bump hour
                d.setHours(d.getHours() + 1);
                d.setMinutes(0);
            }
            updateValue(d);
        }
        setIsOpen(false);
    };

    return (
        <div>
            <label className="block text-xs text-white/50 mb-2 uppercase">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm text-left flex items-center gap-2 hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="flex-1">{formatDisplay()}</span>
            </button>

            {/* Use Portal to render modal at document.body level */}
            {isOpen && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ zIndex: 99999999 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        style={{ zIndex: 99999999 }}
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        className="relative w-full max-w-sm bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-visible animate-scale-in"
                        style={{ zIndex: 100000000 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/50">
                            <h3 className="text-lg font-semibold text-white">{label}</h3>
                            <button type="button" onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>

                        {/* Month/Year Navigation */}
                        <div className="flex items-center justify-between p-3 border-b border-white/10">
                            <button type="button" onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 text-white/70" />
                            </button>
                            <span className="text-white font-semibold text-lg">
                                {THAI_MONTHS[viewDate.getMonth()]} {toBE(viewDate.getFullYear())}
                            </span>
                            <button type="button" onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5 text-white/70" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="p-4 bg-slate-900">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {THAI_DAYS.map(d => (
                                    <div key={d} className="text-center text-xs text-white/40 font-medium py-2">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {generateCalendar().map((day, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => day && !isPast(day) && selectDate(day)}
                                        disabled={!day || isPast(day)}
                                        className={`h-10 rounded-lg text-sm font-medium transition-all
                                            ${!day ? 'invisible' : ''}
                                            ${isPast(day) ? 'text-white/20 cursor-not-allowed' : 'hover:bg-white/10'}
                                            ${isSelected(day) ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50' : ''}
                                            ${isToday(day) && !isSelected(day) ? 'ring-1 ring-blue-400 text-blue-400' : 'text-white/80'}
                                        `}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Picker */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-center gap-3 bg-slate-900 overflow-visible relative">
                            <Clock className="w-5 h-5 text-white/50" />

                            <TimeSelect
                                value={currentHour}
                                options={getAvailableHours()}
                                onChange={setHour}
                            />

                            <span className="text-white/50 text-xl">:</span>

                            <TimeSelect
                                value={currentMinute}
                                options={getAvailableMinutes()}
                                onChange={setMinute}
                            />

                            <span className="text-white/50 text-lg">น.</span>
                        </div>

                        {/* Confirm Button */}
                        <div className="p-4 border-t border-white/10 bg-slate-900">
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg"
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
