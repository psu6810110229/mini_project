import { Trash2, Lock, Loader, AlertTriangle } from 'lucide-react';

interface DeleteLogsModalProps {
    show: boolean;
    onClose: () => void;
    deletePassword: string;
    setDeletePassword: (val: string) => void;
    deleteDays: number | null;
    setDeleteDays: (val: number | null) => void;
    deleteLoading: boolean;
    deleteError: string;
    deleteSuccess: string;
    onDelete: () => void;
}

export default function DeleteLogsModal({
    show, onClose, deletePassword, setDeletePassword,
    deleteDays, setDeleteDays, deleteLoading, deleteError, deleteSuccess, onDelete
}: DeleteLogsModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => !deleteLoading && onClose()} />
            <div className="relative backdrop-blur-2xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-white/20 animate-scale-in">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">ลบประวัติกิจกรรม</h3>
                            <p className="text-white/50 text-sm">ลบแล้วไม่สามารถกู้คืนได้</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* Time range selection */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">ช่วงที่ต้องการลบ</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 7, label: 'เก่ากว่า 7 วัน' },
                                { value: 30, label: 'เก่ากว่า 30 วัน' },
                                { value: null, label: 'ทั้งหมด' },
                            ].map(opt => (
                                <button
                                    key={String(opt.value)}
                                    onClick={() => setDeleteDays(opt.value)}
                                    className={`px-2 py-2 rounded-xl text-xs font-medium transition-all border ${deleteDays === opt.value ? 'bg-red-600 text-white border-red-400' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Admin password */}
                    <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">
                            <Lock className="inline w-4 h-4 mr-1" /> รหัสผ่านแอดมิน
                        </label>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
                            className="w-full bg-slate-800/60 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                    </div>

                    {/* Error message */}
                    {deleteError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                            <AlertTriangle className="w-4 h-4" /> {deleteError}
                        </div>
                    )}

                    {/* Success message */}
                    {deleteSuccess && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
                            ✅ {deleteSuccess}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={deleteLoading}
                        className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={deleteLoading || !deletePassword}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {deleteLoading ? <><Loader className="w-4 h-4 animate-spin" /> กำลังลบ...</> : 'ลบประวัติ'}
                    </button>
                </div>
            </div>
        </div>
    );
}
