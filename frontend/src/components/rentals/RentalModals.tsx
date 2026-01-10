import { Package, X, FileText, CheckCircle, AlertTriangle, AlertOctagon, Loader } from 'lucide-react';
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

export function RentalDetailModal({ rental, isOpen, onClose, onApprove, onReject }: DetailModalProps) {
    if (!isOpen || !rental) return null;
    const duration = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                <div className="relative h-48 bg-white flex items-center justify-center">
                    {rental.equipment?.imageUrl ? (
                        <img src={rental.equipment.imageUrl} alt={rental.equipment.name} className="w-full h-full object-contain p-6" />
                    ) : (
                        <Package className="w-20 h-20 text-gray-400" />
                    )}
                    <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"><X className="w-5 h-5" /></button>
                    <span className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(rental.status)}`}>{getStatusLabel(rental.status)}</span>
                </div>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-1">{rental.equipment?.name}</h2>
                    {rental.equipmentItem?.itemCode && <p className="text-white/60 text-sm mb-4">Item Code: {rental.equipmentItem.itemCode}</p>}
                    <div className="space-y-4">
                        <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="text-sm font-semibold text-white/60 mb-2">Requester</h3>
                            <div className="text-white font-bold text-lg">{rental.user?.name || 'Unknown'}</div>
                            <div className="text-white/60 text-sm">Student ID: {rental.user?.studentId}</div>
                        </div>
                        <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="text-sm font-semibold text-white/60 mb-2">Rental Duration</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-white/50">Start Date</div>
                                    <div className="text-white font-medium">{new Date(rental.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-white/50">End Date</div>
                                    <div className="text-white font-medium">{new Date(rental.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                </div>
                            </div>
                            <div className="mt-2 text-center text-blue-400 font-medium text-sm">📅 Total: {duration} days</div>
                        </div>
                        <div className="backdrop-blur-xl bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
                            <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Request Details</h3>
                            <p className="text-white/80 text-sm whitespace-pre-wrap">{rental.requestDetails || 'No additional details provided.'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20">Close</button>
                        {rental.status === 'PENDING' && (
                            <>
                                <button onClick={() => { onClose(); onApprove(rental.id, rental.user?.name || ''); }} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg">Approve</button>
                                <button onClick={() => { onClose(); onReject(rental.id, rental.user?.name || ''); }} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg">Reject</button>
                            </>
                        )}
                    </div>
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

export function ActionConfirmModal({ isOpen, action, overlappingPending, onConfirm, onCancel }: ConfirmModalProps) {
    if (!isOpen || !action) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onCancel} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in border border-white/20">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Confirm Action</h3>
                    <p className="text-white/60">Are you sure you want to <span className="text-white font-semibold">{getActionLabel(action.status)}</span><br />for <span className="text-white font-semibold">{action.userName}</span>?</p>
                    {overlappingPending.length > 0 && (
                        <div className="mt-4 p-3 bg-orange-900/30 border border-orange-500/50 rounded-xl text-left">
                            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm mb-2"><AlertOctagon className="w-4 h-4" /> Warning: Overlapping requests will be auto-rejected</div>
                            <ul className="text-white/70 text-sm space-y-1">
                                {overlappingPending.map((r) => (<li key={r.id} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>{r.user?.name || 'Unknown'}</li>))}
                            </ul>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20">Cancel</button>
                    <button onClick={onConfirm} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg ${action.status === 'REJECTED' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>Confirm</button>
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

export function RejectModal({ isOpen, rental, note, onNoteChange, onConfirm, onCancel, loading }: RejectModalProps) {
    if (!isOpen || !rental) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => !loading && onCancel()} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center"><X className="w-6 h-6 text-red-400" /></div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Reject Request</h3>
                            <p className="text-white/50 text-sm">From {rental.userName} for {rental.equipmentName}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-white/70">Are you sure you want to reject this rental request?</p>
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Note to user <span className="text-white/40">(optional)</span></label>
                        <textarea value={note} onChange={(e) => onNoteChange(e.target.value)} placeholder="e.g., Equipment is unavailable..." rows={3} className="w-full bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none" />
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50">Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><Loader className="w-4 h-4 animate-spin" /> Rejecting...</> : 'Reject Request'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Batch Modal Props
interface BatchModalProps {
    isOpen: boolean;
    action: 'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | null;
    selectedIds: Set<string>;
    rentals: Rental[];
    processing: boolean;
    progress: { current: number; total: number; errors: string[] };
    onConfirm: () => void;
    onClose: () => void;
}

export function BatchActionModal({ isOpen, action, selectedIds, rentals, processing, progress, onConfirm, onClose }: BatchModalProps) {
    if (!isOpen || !action) return null;

    const actionConfig = {
        APPROVED: { label: 'Approve', bgClass: 'bg-green-500/20', iconClass: 'text-green-400', btnClass: 'bg-gradient-to-r from-green-500 to-green-600' },
        CHECKED_OUT: { label: 'Checkout', bgClass: 'bg-blue-500/20', iconClass: 'text-blue-400', btnClass: 'bg-gradient-to-r from-blue-500 to-blue-600' },
        RETURNED: { label: 'Return', bgClass: 'bg-gray-500/20', iconClass: 'text-gray-400', btnClass: 'bg-gradient-to-r from-gray-500 to-gray-600' }
    };
    const { label, bgClass, iconClass, btnClass } = actionConfig[action];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => !processing && onClose()} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in border border-white/20">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}>
                            {action === 'APPROVED' ? <CheckCircle className={`w-6 h-6 ${iconClass}`} /> : <Package className={`w-6 h-6 ${iconClass}`} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Batch {label}</h3>
                            <p className="text-white/50 text-sm">{processing ? `Processing ${progress.current}/${progress.total}...` : `${selectedIds.size} rental(s) will be processed`}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    {processing ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3"><Loader className="w-5 h-5 text-blue-400 animate-spin" /><span className="text-white">Processing rentals...</span></div>
                            <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }} /></div>
                        </div>
                    ) : progress.errors.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" /><span className="font-medium">Some items failed:</span></div>
                            <div className="max-h-40 overflow-y-auto space-y-1">{progress.errors.map((err, i) => <p key={i} className="text-sm text-red-300/80 bg-red-500/10 rounded-lg px-3 py-2">{err}</p>)}</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-white/70">Are you sure you want to <span className="font-semibold text-white">{label.toLowerCase()}</span> the following rentals?</p>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {Array.from(selectedIds).map(id => {
                                    const rental = rentals.find(r => r.id === id);
                                    return rental ? <div key={id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 text-sm"><span className="text-white font-medium">{rental.user?.name}</span><span className="text-white/40">-</span><span className="text-white/60">{rental.equipment?.name}</span></div> : null;
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onClose} disabled={processing} className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50">{progress.errors.length > 0 ? 'Close' : 'Cancel'}</button>
                    {progress.errors.length === 0 && <button onClick={onConfirm} disabled={processing} className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${btnClass}`}>{processing ? 'Processing...' : 'Confirm'}</button>}
                </div>
            </div>
        </div>
    );
}
