import { Package, X, FileText, CheckCircle, AlertTriangle, AlertOctagon, Loader, Camera } from 'lucide-react';
import type { Rental } from '../../types';
import { getStatusColor, getStatusLabel, getActionLabel } from '../../utils/statusHelpers';

// Detail Modal Props
interface DetailModalProps {
    rental: Rental | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string, userName: string) => void;
    onReject: (id: string, userName: string) => void;
}

/**
 * Modal to display comprehensive information about a specific rental request.
 * Includes equipment details, requester information, rental duration, and uploaded evidence photos.
 */
export function RentalDetailModal({ rental, isOpen, onClose, onApprove, onReject }: DetailModalProps) {
    if (!isOpen || !rental) return null;

    // Calculate total days for the duration display
    const duration = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative backdrop-blur-2xl bg-slate-900/95 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in border border-white/10 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-start gap-4 p-5 border-b border-white/10 bg-white/5">
                    <div className="w-20 h-20 bg-white rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-lg border border-white/10">
                        {rental.equipment?.imageUrl ? (
                            <img src={rental.equipment.imageUrl} alt={rental.equipment.name} className="w-full h-full object-contain p-2" />
                        ) : (
                            <Package className="w-10 h-10 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-white leading-tight truncate pr-2">{rental.equipment?.name}</h2>
                                {rental.equipmentItem?.itemCode && (
                                    <p className="text-white/50 text-xs mt-0.5 font-mono">Item Code: {rental.equipmentItem.itemCode}</p>
                                )}
                            </div>
                            <span className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${getStatusColor(rental.status)}`}>
                                {getStatusLabel(rental.status)}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-white/60 bg-black/20 w-fit px-2 py-1 rounded-md">
                            <span className="text-blue-400 font-semibold">{duration} วัน</span>
                            <span className="w-px h-3 bg-white/20"></span>
                            <span>{new Date(rental.startDate).toLocaleDateString('th-TH-u-ca-buddhist', { month: 'short', day: 'numeric' })} - {new Date(rental.endDate).toLocaleDateString('th-TH-u-ca-buddhist', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar p-5 space-y-4">
                    {/* Requester Info */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner flex-shrink-0">
                            {rental.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-white truncate">{rental.user?.name || 'ไม่ทราบ'}</div>
                            <div className="text-xs text-white/50">{rental.user?.studentId}</div>
                        </div>
                    </div>

                    {/* Request Details */}
                    {rental.requestDetails && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/50 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> โน้ต
                            </label>
                            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-sm text-white/80 leading-relaxed">
                                {rental.requestDetails}
                            </div>
                        </div>
                    )}

                    {/* Review Evidence - Compact Grid */}
                    {(rental.checkoutImageUrl || rental.returnImageUrl) && (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                            <label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5" /> หลักฐาน
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {rental.checkoutImageUrl && (
                                    <a href={rental.checkoutImageUrl} target="_blank" rel="noreferrer" className="group relative block rounded-lg overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] hover:border-blue-500/50 transition-colors">
                                        <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">รับของ</div>
                                        <img src={rental.checkoutImageUrl} alt="Pickup" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        {rental.checkoutNote && (
                                            <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm p-2">
                                                <p className="text-[10px] text-white/90 truncate">"{rental.checkoutNote}"</p>
                                            </div>
                                        )}
                                    </a>
                                )}
                                {rental.returnImageUrl && (
                                    <a href={rental.returnImageUrl} target="_blank" rel="noreferrer" className="group relative block rounded-lg overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] hover:border-green-500/50 transition-colors">
                                        <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">คืนของ</div>
                                        <img src={rental.returnImageUrl} alt="Return" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        {rental.returnNote && (
                                            <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm p-2">
                                                <p className="text-[10px] text-white/90 truncate">"{rental.returnNote}"</p>
                                            </div>
                                        )}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                        ปิด
                    </button>
                    {rental.status === 'PENDING' && (
                        <>
                            <button onClick={() => { onClose(); onReject(rental.id, rental.user?.name || ''); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-colors">
                                ปฏิเสธ
                            </button>
                            <button onClick={() => { onClose(); onApprove(rental.id, rental.user?.name || ''); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-green-500/20 transition-all">
                                อนุมัติ
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Confirm Modal Props
interface ConfirmModalProps {
    isOpen: boolean;
    action: { id: string; status: string; userName: string } | null;
    overlappingPending: Rental[];
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Simple confirmation modal used before performing critical actions like approving or rejecting.
 * Shows a warning if there are overlapping pending requests that will be auto-rejected.
 */
export function ActionConfirmModal({ isOpen, action, overlappingPending, onConfirm, onCancel }: ConfirmModalProps) {
    if (!isOpen || !action) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onCancel} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in border border-white/20">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">ยืนยัน</h3>
                    <p className="text-white/60">แน่ใจหรือเปล่าว่าต้องการ <span className="text-white font-semibold">{getActionLabel(action.status)}</span><br />สำหรับ <span className="text-white font-semibold">{action.userName}</span>?</p>
                    {overlappingPending.length > 0 && (
                        <div className="mt-4 p-3 bg-orange-900/30 border border-orange-500/50 rounded-xl text-left">
                            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm mb-2"><AlertOctagon className="w-4 h-4" />⚠️ คำขออื่นที่ซ้อนจะถูกปฏิเสธอัตโนมัติ</div>
                            <ul className="text-white/70 text-sm space-y-1">
                                {overlappingPending.map((r) => (<li key={r.id} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>{r.user?.name || 'ไม่ทราบ'}</li>))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20">ยกเลิก</button>
                    <button onClick={onConfirm} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg ${action.status === 'REJECTED' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>ยืนยัน</button>
                </div>
            </div>
        </div>
    );
}

// Reject Modal Props
interface RejectModalProps {
    isOpen: boolean;
    rental: { id: string; userName: string; equipmentName: string } | null;
    note: string;
    onNoteChange: (note: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}

/**
 * Specialized modal for rejecting a rental.
 * Includes an optional text area for the admin to provide a reason for rejection.
 */
export function RejectModal({ isOpen, rental, note, onNoteChange, onConfirm, onCancel, loading }: RejectModalProps) {
    if (!isOpen || !rental) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => !loading && onCancel()} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center"><X className="w-6 h-6 text-red-400" /></div>
                        <div>
                            <h3 className="text-xl font-bold text-white">ปฏิเสธคำขอ</h3>
                            <p className="text-white/50 text-sm">จาก {rental.userName} สำหรับ {rental.equipmentName}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-white/70">แน่ใจหรือเปล่าว่าต้องการปฏิเสธคำขอนี้?</p>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">แจ้งเหตุผล <span className="text-white/40">(ถ้ามี)</span></label>
                        <textarea value={note} onChange={(e) => onNoteChange(e.target.value)} placeholder="เช่น อุปกรณ์ไม่ว่าง..." rows={3} className="w-full bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none" />
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50">ยกเลิก</button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><Loader className="w-4 h-4 animate-spin" /> กำลังปฏิเสธ...</> : 'ปฏิเสธคำขอ'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Batch Modal Props
interface BatchModalProps {
    isOpen: boolean;
    action: 'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | 'REJECTED' | null;
    selectedIds: Set<string>;
    rentals: Rental[];
    processing: boolean;
    progress: { current: number; total: number; errors: string[] };
    rejectNote?: string;
    onRejectNoteChange?: (note: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * Modal for performing actions on multiple selected rentals simultaneously.
 * Displays progress and any errors encountered during the batch operation.
 */
export function BatchActionModal({ isOpen, action, selectedIds, rentals, processing, progress, rejectNote, onRejectNoteChange, onConfirm, onClose }: BatchModalProps) {
    if (!isOpen || !action) return null;

    const actionConfig: Record<string, { label: string; bgClass: string; iconClass: string; btnClass: string }> = {
        APPROVED: { label: 'อนุมัติ', bgClass: 'bg-green-500/20', iconClass: 'text-green-400', btnClass: 'bg-gradient-to-r from-green-500 to-green-600' },
        CHECKED_OUT: { label: 'รับของ', bgClass: 'bg-blue-500/20', iconClass: 'text-blue-400', btnClass: 'bg-gradient-to-r from-blue-500 to-blue-600' },
        RETURNED: { label: 'คืนของ', bgClass: 'bg-gray-500/20', iconClass: 'text-gray-400', btnClass: 'bg-gradient-to-r from-gray-500 to-gray-600' },
        REJECTED: { label: 'ปฏิเสธ', bgClass: 'bg-red-500/20', iconClass: 'text-red-400', btnClass: 'bg-gradient-to-r from-red-500 to-red-600' }
    };
    const { label, bgClass, iconClass, btnClass } = actionConfig[action];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => !processing && onClose()} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}>
                            {action === 'APPROVED' ? <CheckCircle className={`w-6 h-6 ${iconClass}`} /> : action === 'REJECTED' ? <X className={`w-6 h-6 ${iconClass}`} /> : <Package className={`w-6 h-6 ${iconClass}`} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">ดำเนินการหลายรายการ: {label}</h3>
                            <p className="text-white/50 text-sm">{processing ? `กำลังดำเนินการ ${progress.current}/${progress.total}...` : `จะดำเนินการ ${selectedIds.size} รายการ`}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    {processing ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3"><Loader className="w-5 h-5 text-blue-400 animate-spin" /><span className="text-white">กำลังดำเนินการ...</span></div>
                            <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }} /></div>
                        </div>
                    ) : progress.errors.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" /><span className="font-medium">บางรายการมีปัญหา:</span></div>
                            <div className="max-h-40 overflow-y-auto space-y-1">{progress.errors.map((err, i) => <p key={i} className="text-sm text-red-300/80 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>)}</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-white/70">แน่ใจหรือเปล่าว่าต้องการ <span className="font-semibold text-white">{label.toLowerCase()}</span> รายการเหล่านี้?</p>
                            <div className="max-h-32 overflow-y-auto space-y-2">
                                {Array.from(selectedIds).map(id => {
                                    const rental = rentals.find(r => r.id === id);
                                    return rental ? <div key={id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm"><span className="text-white font-medium">{rental.user?.name}</span><span className="text-white/40">-</span><span className="text-white/60">{rental.equipment?.name}</span></div> : null;
                                })}
                            </div>
                            {/* Reject reason input for batch reject */}
                            {action === 'REJECTED' && onRejectNoteChange && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-white/70 mb-2">เหตุผลที่ปฏิเสธ <span className="text-white/40">(ถ้ามี)</span></label>
                                    <textarea value={rejectNote || ''} onChange={(e) => onRejectNoteChange(e.target.value)} placeholder="เช่น อุปกรณ์ไม่ว่างช่วงนี้..." rows={2} className="w-full bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onClose} disabled={processing} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50">{progress.errors.length > 0 ? 'ปิด' : 'ยกเลิก'}</button>
                    {progress.errors.length === 0 && <button onClick={onConfirm} disabled={processing} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${btnClass}`}>{processing ? 'กำลังดำเนินการ...' : 'ยืนยัน'}</button>}
                </div>
            </div>
        </div>
    );
}
