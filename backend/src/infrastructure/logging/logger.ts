export class Logger {
    static info(message: string, meta?: any) {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '');
    }

    static error(message: string, error?: any) {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    }

    static warn(message: string, meta?: any) {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '');
    }
}
