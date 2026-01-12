import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

interface Props {
    value: string;
    onChange: (v: string) => void;
    label: string;
}

export default function ThaiDateTimePicker({ value, onChange, label }: Props) {
    const [open, setOpen] = useState(false);
    const selected = value ? new Date(value) : new Date();
    const [month, setMonth] = useState(selected.getMonth());
    const [year, setYear] = useState(selected.getFullYear());

    // แปลง Date เป็น string format "YYYY-MM-DDTHH:mm" (Local time)
    const formatDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    // สร้างวันในเดือน
    const days = () => {
        const first = new Date(year, month, 1).getDay();
        const total = new Date(year, month + 1, 0).getDate();
        return [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
    };

    // เลือกวัน
    const pickDay = (day: number) => {
        const d = new Date(year, month, day, selected.getHours(), selected.getMinutes());
        onChange(formatDate(d));
    };

    // เลือกเวลา
    const setHour = (h: number) => {
        const d = new Date(selected);
        d.setHours(h);
        onChange(formatDate(d));
    };

    const setMinute = (m: number) => {
        const d = new Date(selected);
        d.setMinutes(m);
        onChange(formatDate(d));
    };

    // แสดงผล
    const display = `${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear() + 543} ${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')} น.`;

    return (
        <div>
            <label className="text-xs text-white/50 mb-1 block">{label}</label>
            <button type="button" onClick={() => setOpen(true)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 flex gap-2 text-white text-sm hover:bg-white/15">
                <Calendar size={16} className="text-blue-400" /><span>{display}</span>
            </button>

            {open && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative bg-slate-900 rounded-2xl w-80 border border-white/20 overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between p-3 border-b border-white/10">
                            <span className="text-white font-bold">{label}</span>
                            <X className="text-white/70 cursor-pointer" onClick={() => setOpen(false)} />
                        </div>

                        {/* เดือน */}
                        <div className="flex justify-between p-2 border-b border-white/10">
                            <ChevronLeft className="text-white cursor-pointer" onClick={() => month === 0 ? (setMonth(11), setYear(year - 1)) : setMonth(month - 1)} />
                            <span className="text-white">{MONTHS[month]} {year + 543}</span>
                            <ChevronRight className="text-white cursor-pointer" onClick={() => month === 11 ? (setMonth(0), setYear(year + 1)) : setMonth(month + 1)} />
                        </div>

                        {/* ปฏิทิน */}
                        <div className="p-2 grid grid-cols-7 gap-1 text-center">
                            {DAYS.map(d => <span key={d} className="text-xs text-white/40">{d}</span>)}
                            {days().map((d, i) => (
                                <button key={i} type="button" onClick={() => d && pickDay(d)}
                                    className={`h-8 rounded text-sm ${!d ? 'invisible' : d === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear() ? 'bg-blue-600 text-white' : 'text-white hover:bg-white/10'}`}>
                                    {d}
                                </button>
                            ))}
                        </div>

                        {/* เวลา */}
                        <div className="p-3 border-t border-white/10 flex justify-center gap-2 items-center">
                            <span className="text-white/50">เวลา:</span>
                            <input
                                type="number"
                                min="0"
                                max="23"
                                value={selected.getHours()}
                                onChange={e => setHour(Math.min(23, Math.max(0, +e.target.value)))}
                                className="w-14 bg-slate-700 text-white text-center rounded p-2 border border-white/20"
                            />
                            <span className="text-white text-xl">:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                step="10"
                                value={selected.getMinutes()}
                                onChange={e => setMinute(Math.min(59, Math.max(0, +e.target.value)))}
                                className="w-14 bg-slate-700 text-white text-center rounded p-2 border border-white/20"
                            />
                            <span className="text-white/50">น.</span>
                        </div>

                        <button type="button" onClick={() => setOpen(false)} className="w-full p-3 bg-blue-600 text-white font-bold">ยืนยัน</button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
