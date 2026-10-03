/**
 * Good Things Co. — Ambient Types for Server & Node Scripts
 */

declare namespace NodeJS {
  interface ProcessEnv {
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    EMAIL_REPLY_TO?: string;
    ADMIN_NOTIFICATION_EMAIL?: string;
    [key: string]: string | undefined;
  }
}
