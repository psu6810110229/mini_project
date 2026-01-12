import { useRef, useState } from 'react';
import { X, Upload, FileText, CheckCircle, Loader } from 'lucide-react';
import apiClient from '../../api/client';

interface UploadEvidenceModalProps {
    isOpen: boolean;
    rentalId: string;
    imageType: 'checkout' | 'return';
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * Modal to handle the upload of evidence images (checkout or return).
 * Includes image preview, note input, and multipart/form-data submission.
 */
export default function UploadEvidenceModal({ isOpen, rentalId, imageType, onClose, onSuccess }: UploadEvidenceModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState('');
    const [note, setNote] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Handle image file selection and create a temporary preview URL
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) return setError('ไฟล์ใหญ่เกิน 5MB');
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setError('');
        }
    };

    // Submit the evidence via multipart/form-data to the backend
    const handleSubmit = async () => {
        if (!file) return setError('เลือกรูปก่อนนะ');
        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('imageType', imageType);
        if (note.trim()) formData.append('note', note.trim());

        try {
            await apiClient.post(`/rentals/${rentalId}/upload-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'อัปโหลดไม่สำเร็จ');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => !uploading && onClose()} />
            <div className="relative backdrop-blur-2xl bg-slate-900/90 rounded-3xl border border-white/20 p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white capitalize">{imageType === 'checkout' ? 'หลักฐานการรับของ' : 'หลักฐานการคืนของ'}</h3>
                    <button onClick={onClose} disabled={uploading} className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Image Upload Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${preview ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-blue-500/50 hover:bg-slate-800/50'
                            }`}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        {preview ? (
                            <div className="relative">
                                <img src={preview} alt="Evidence" className="max-h-48 mx-auto rounded-lg" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                    <span className="text-white text-sm font-medium">แตะเพื่อเปลี่ยน</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                                    <Upload className="w-6 h-6 text-blue-400" />
                                </div>
                                <p className="text-white font-medium">แตะเพื่ออัปโหลดรูป</p>
                                <p className="text-white/40 text-xs">ไม่เกิน 5MB (JPG, PNG)</p>
                            </div>
                        )}
                    </div>

                    {/* Note Input */}
                    <div>
                        <label className="text-sm font-medium text-white/70 mb-2 block flex items-center gap-2">
                            <FileText className="w-4 h-4" /> หมายเหตุ <span className="text-white/30 text-xs font-normal">(ถ้ามี)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="เช่น สภาพ หรือจุดที่รับ/คืน..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24 text-sm"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={uploading || !file}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                    >
                        {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        {uploading ? 'กำลังอัปโหลด...' : 'ยืนยัน'}
                    </button>
                </div>
            </div>
        </div>
    );
}
