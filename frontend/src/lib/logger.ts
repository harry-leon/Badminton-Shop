import winston from 'winston';
import { queryDb } from './db';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export type LogModule =
  | 'AUTH'
  | 'USERS'
  | 'BRANCHES'
  | 'PRODUCTS'
  | 'CATEGORIES'
  | 'BANNERS'
  | 'ORDERS'
  | 'WARRANTY'
  | 'INVENTORY'
  | 'SETTINGS'
  | 'REVIEWS'
  | 'SYSTEM';

export interface AuditLogPayload {
  level?: LogLevel;
  module: LogModule;
  action: string;
  message: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

// Custom format cho Winston Console Output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, module, action, ...meta }) => {
    const modStr = module ? ` [${module}]` : '';
    const actStr = action ? ` (${action})` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}${modStr}${actStr}: ${message}${metaStr}`;
  })
);

// Khởi tạo Winston Logger Instance (Singleton)
const globalLogger = global as unknown as { __app_winston_logger?: winston.Logger };

export const winstonLogger =
  globalLogger.__app_winston_logger ||
  winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalLogger.__app_winston_logger = winstonLogger;
}

/**
 * Hàm ghi nhật ký hoạt động (Audit Log) chuẩn mực:
 * 1. Xuất qua Winston Console Logger có màu sắc và cấu trúc.
 * 2. Lưu vào bảng audit_logs trong PostgreSQL identity_db để Admin tra cứu trên giao diện.
 */
export async function logAudit(payload: AuditLogPayload): Promise<void> {
  const {
    level = 'INFO',
    module,
    action,
    message,
    actorId = null,
    actorName = 'SYSTEM',
    actorRole = 'SYSTEM',
    ipAddress = '127.0.0.1',
    userAgent = 'Internal',
    details = {},
  } = payload;

  // 1. Ghi log qua Winston
  const winstonLevel = level.toLowerCase() === 'critical' ? 'error' : level.toLowerCase();
  winstonLogger.log({
    level: winstonLevel,
    message,
    module,
    action,
    actorName,
    actorRole,
    ipAddress,
    ...details,
  });

  // 2. Ghi vào cơ sở dữ liệu PostgreSQL (chạy non-blocking)
  try {
    await queryDb(
      'identity_db',
      `INSERT INTO audit_logs 
       (level, module, action, actor_id, actor_name, actor_role, ip_address, user_agent, message, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        level,
        module,
        action,
        actorId,
        actorName,
        actorRole,
        ipAddress,
        userAgent,
        message,
        JSON.stringify(details),
      ]
    );
  } catch (dbErr) {
    // Không làm gián đoạn luồng nghiệp vụ chính nếu DB log gặp sự cố
    console.error('Lỗi khi lưu audit_log vào PostgreSQL:', dbErr);
  }
}
