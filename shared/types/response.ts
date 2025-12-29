/**
 * Global Response Wrapper
 * Standard response structure for all API endpoints
 */

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    statusCode: number;
    timestamp: string;
}

export class ResponseWrapper {
    static success<T>(data: T, message?: string, statusCode = 200): ApiResponse<T> {
        return {
            success: true,
            data,
            message,
            statusCode,
            timestamp: new Date().toISOString(),
        };
    }

    static error(error: string, statusCode = 500, message?: string): ApiResponse<null> {
        return {
            success: false,
            error,
            message,
            statusCode,
            timestamp: new Date().toISOString(),
        };
    }

    static paginated<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
        message?: string,
    ): ApiResponse<{ items: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        return {
            success: true,
            data: {
                items: data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
            message,
            statusCode: 200,
            timestamp: new Date().toISOString(),
        };
    }
}
