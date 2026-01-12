import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X, Clock, Trash2, AlertTriangle, FileText, ShoppingBag, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import apiClient from '../api/client';
import ConfirmModal from './ui/ConfirmModal';
import ThaiDateTimePicker from './ThaiDateTimePicker';

interface OverlapInfo { id: string; status: string; startDate: string; endDate: string; userName: string; }

const formatDateTimeLocal = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const formatTimeRemaining = (expiresAt: number) => { const r = Math.max(0, expiresAt - Date.now()); return `${Math.floor(r / 60000)}:${String(Math.floor((r % 60000) / 1000)).padStart(2, '0')}`; };
const formatDisplayDate = (d: string) => new Date(d).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function RentalListButton() {
    const { cartItems, removeFromCart, clearCart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rentalReason, setRentalReason] = useState('');
    const [overlapWarning, setOverlapWarning] = useState<OverlapInfo[] | null>(null);
    const [showOverlapModal, setShowOverlapModal] = useState(false);
    const [checkingOverlap, setCheckingOverlap] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: string; itemId?: string } | null>(null);
    const [, setTick] = useState(0);

    useEffect(() => { if (cartItems.length === 0) return; const i = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(i); }, [cartItems.length]);
    useEffect(() => { if (isOpen && !startDate) { const n = new Date(); n.setMinutes(n.getMinutes() + 30); setStartDate(formatDateTimeLocal(n)); setEndDate(formatDateTimeLocal(new Date(n.getTime() + 7 * 86400000))); } }, [isOpen, startDate]);

    const checkForOverlaps = async (): Promise<boolean> => {
        setCheckingOverlap(true); setError('');
        try {
            const s = new Date(startDate), e = new Date(endDate);
            for (const item of cartItems) {
                const r = await apiClient.post('/rentals/check-overlap', { equipmentId: item.equipmentId, equipmentItemId: item.itemId, startDate: s.toISOString(), endDate: e.toISOString() });
                if (r.data.hasOverlap) { setOverlapWarning(r.data.overlappingRentals); setShowOverlapModal(true); return true; }
            }
            return false;
        } catch (err: any) { setError(err.response?.data?.message || 'ตรวจสอบวันว่างไม่สำเร็จ'); return false; }
        finally { setCheckingOverlap(false); }
    };

    const handleConfirmClick = async () => {
        if (cartItems.length === 0) return;
        const s = new Date(startDate), e = new Date(endDate), now = new Date();
        if (s < now) return setError('วันเริ่มต้องไม่เป็นวันในอดีต');
        if (e <= s) return setError('วันสิ้นสุดต้องหลังวันเริ่ม');
        if (!rentalReason.trim()) return setError('กรุณาระบุเหตุผลในการยืม');
        if (!(await checkForOverlaps())) await submitRentals(false);
    };

    const submitRentals = async (allowOverlap = false) => {
        setSubmitting(true); setError('');
        try {
            const s = new Date(startDate), e = new Date(endDate);
            for (const item of cartItems) await apiClient.post('/rentals', { equipmentId: item.equipmentId, equipmentItemId: item.itemId, startDate: s.toISOString(), endDate: e.toISOString(), requestDetails: rentalReason.trim(), allowOverlap });
            clearCart(); setRentalReason(''); setIsOpen(false); setShowOverlapModal(false); setOverlapWarning(null); navigate('/my-rentals');
        } catch (err: any) { setError(err.response?.data?.message || 'ส่งคำขอยืมไม่สำเร็จ'); }
        finally { setSubmitting(false); }
    };

    const showConfirmation = (type: string, itemId?: string) => { setConfirmAction({ type, itemId }); setShowConfirmModal(true); };
    const handleConfirmedAction = () => { if (confirmAction?.type === 'removeItem' && confirmAction.itemId) removeFromCart(confirmAction.itemId); else if (confirmAction?.type === 'clearAll') clearCart(); setShowConfirmModal(false); setConfirmAction(null); };
    const isConfirmDisabled = submitting || !startDate || !endDate || !rentalReason.trim() || checkingOverlap;

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 backdrop-blur-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-2xl shadow-2xl z-40 transition-all hover:scale-110 border border-white/20 group">
                <ShoppingBag className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                {cartItems.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-bounce">{cartItems.length}</span>}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-lg backdrop-blur-2xl bg-gradient-to-b from-slate-900/90 to-slate-800/90 shadow-2xl animate-slide-in-right border-l border-white/10">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                                <div><h2 className="text-2xl font-bold text-white flex items-center gap-3"><div className="p-2 bg-white/10 rounded-xl"><ShoppingBag className="h-6 w-6" /></div>รายการที่เลือก</h2><p className="text-white/60 text-sm mt-1">{cartItems.length} รายการ</p></div>
                                <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-xl hover:rotate-90 transition-all"><X className="h-6 w-6 text-white/70" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-16"><div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center"><ShoppingBag className="h-12 w-12 text-white/30" /></div><h3 className="text-xl font-semibold text-white mb-2">ยังไม่มีรายการที่เลือก</h3><p className="text-white/50">เลือกอุปกรณ์จากรายการเพื่อเริ่มยืม</p></div>
                                ) : (<>
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider flex items-center gap-2"><ClipboardList className="w-4 h-4" />อุปกรณ์ที่เลือก</h3>
                                        {cartItems.map((item, i) => (
                                            <div key={item.itemId} className="group backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex-shrink-0 shadow-lg">{item.equipmentImage ? <img src={item.equipmentImage} alt={item.equipmentName} className="w-full h-full object-contain p-1" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag className="w-6 h-6" /></div>}</div>
                                                    <div className="flex-1 min-w-0"><h4 className="font-semibold text-white truncate">{item.equipmentName}</h4><p className="text-sm text-white/50">Item Code: {item.itemCode}</p><div className="flex items-center gap-2 mt-2"><Clock className="h-3 w-3 text-amber-400" /><span className="text-xs font-mono text-amber-400">{formatTimeRemaining(item.expiresAt)}</span></div></div>
                                                    <button onClick={() => showConfirmation('removeItem', item.itemId)} className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-5 w-5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="backdrop-blur-xl bg-blue-500/10 rounded-2xl p-5 border border-blue-500/20 space-y-4">
                                        <h3 className="font-semibold text-white flex items-center gap-2">ช่วงเวลายืม</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <ThaiDateTimePicker label="เริ่ม" value={startDate} onChange={setStartDate} minDate={new Date()} />
                                            <ThaiDateTimePicker label="สิ้นสุด" value={endDate} onChange={setEndDate} minDate={startDate ? new Date(startDate) : undefined} />
                                        </div>
                                    </div>
                                    <div className="backdrop-blur-xl bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20 space-y-3">
                                        <h3 className="font-semibold text-white flex items-center gap-2"><FileText className="h-5 w-5 text-amber-400" />เหตุผลในการยืม <span className="text-red-400">*</span></h3>
                                        <textarea value={rentalReason} onChange={e => setRentalReason(e.target.value)} placeholder="เช่น ถ่ายงาน, โปรเจคตจบ..." rows={3} className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
                                    </div>
                                    {error && <div className="backdrop-blur-xl bg-red-500/20 text-red-300 rounded-xl p-4 text-sm border border-red-500/30">⚠️ {error}</div>}
                                </>)}
                            </div>
                            {cartItems.length > 0 && (
                                <div className="p-6 border-t border-white/10 bg-gradient-to-t from-slate-900/50 space-y-3">
                                    <button onClick={handleConfirmClick} disabled={isConfirmDisabled} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                                        {checkingOverlap || submitting ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>กำลังดำเนินการ...</> : <><CheckCircle className="h-5 w-5" />ยืนยันการยืม</>}
                                    </button>
                                    <button onClick={() => showConfirmation('clearAll')} disabled={submitting} className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-3 rounded-xl font-medium border border-white/10">ล้างทั้งหมด</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showOverlapModal && overlapWarning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowOverlapModal(false)} />
                    <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in border border-white/20">
                        <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-amber-500/20 rounded-2xl"><AlertTriangle className="h-7 w-7 text-amber-400" /></div><div><h3 className="text-xl font-bold text-white">พบการจองซ้อน</h3><p className="text-sm text-white/60">มีคนอื่นขอยืมในช่วงเวลานี้</p></div></div>
                        <div className="bg-white/5 rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto border border-white/10">
                            {overlapWarning.map((r, i) => <div key={r.id} className={i > 0 ? 'border-t border-white/10 pt-3 mt-3' : ''}><div className="flex justify-between items-center"><span className="font-medium text-white">{r.userName}</span><span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : r.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{r.status}</span></div><p className="text-xs text-white/50 mt-1">{formatDisplayDate(r.startDate)} - {formatDisplayDate(r.endDate)}</p></div>)}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowOverlapModal(false); setOverlapWarning(null); }} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20">เปลี่ยนวัน</button>
                            <button onClick={() => { setShowOverlapModal(false); submitRentals(true); }} disabled={submitting} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg disabled:opacity-50">{submitting ? 'กำลังส่ง...' : 'ยืมต่อไปเลย'}</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={showConfirmModal} title="ยืนยันการกระทำ" message={confirmAction?.type === 'removeItem' ? 'ต้องการลบรายการนี้หรือไม่?' : 'ต้องการล้างรายการทั้งหมดหรือไม่?'} variant="warning" confirmLabel="ยืนยัน" onConfirm={handleConfirmedAction} onCancel={() => { setShowConfirmModal(false); setConfirmAction(null); }} />
        </>
    );
}
