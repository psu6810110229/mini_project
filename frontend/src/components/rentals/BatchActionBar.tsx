import { CheckSquare, CheckCircle, XCircle, Package } from 'lucide-react';

interface BatchActionBarProps {
    selectedCount: number;
    pendingCount: number;
    approvedCount: number;
    checkedOutCount: number;
    onBatchAction: (action: 'APPROVED' | 'CHECKED_OUT' | 'RETURNED' | 'REJECTED') => void;
    onClearSelection: () => void;
}

export default function BatchActionBar({
    selectedCount, pendingCount, approvedCount, checkedOutCount, onBatchAction, onClearSelection
}: BatchActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
            <div className="backdrop-blur-2xl bg-slate-900/95 rounded-2xl border border-white/20 shadow-2xl p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
                    <CheckSquare className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-bold">{selectedCount}</span>
                    <span className="text-white/70">รายการที่เลือก</span>
                </div>

                {pendingCount > 0 && (
                    <button onClick={() => onBatchAction('APPROVED')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg">
                        <CheckCircle className="w-4 h-4" /> อนุมัติ ({pendingCount})
                    </button>
                )}

                {pendingCount >= 2 && (
                    <button onClick={() => onBatchAction('REJECTED')} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg">
                        <XCircle className="w-4 h-4" /> ปฏิเสธ ({pendingCount})
                    </button>
                )}

                {approvedCount > 0 && (
                    <button onClick={() => onBatchAction('CHECKED_OUT')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg">
                        <Package className="w-4 h-4" /> ยืนยันรับของ ({approvedCount})
                    </button>
                )}

                {checkedOutCount > 0 && (
                    <button onClick={() => onBatchAction('RETURNED')} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold shadow-lg">
                        ยืนยันคืนของ ({checkedOutCount})
                    </button>
                )}

                <button onClick={onClearSelection} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">✕</button>
            </div>
        </div>
    );
}
