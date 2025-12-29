interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    minStartDate?: string;
    className?: string;
}

export default function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    minStartDate,
    className = '',
}: DateRangePickerProps) {
    // Default minStartDate to today if not provided
    const today = new Date().toISOString().split('T')[0];
    const effectiveMinStart = minStartDate || today;

    return (
        <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date
                </label>
                <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    min={effectiveMinStart}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    End Date
                </label>
                <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    min={startDate || effectiveMinStart}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
    );
}
