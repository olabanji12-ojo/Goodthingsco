import { getAdminAuth } from '../firebase.js';

export type AdminIdentity = { uid: string; admin?: unknown; email?: string };
type ErrorConstructor = new (status: number, message: string) => Error;

export async function authorizeAdmin(
  authorization: string | undefined,
  ErrorType: ErrorConstructor,
  verify: (token: string) => Promise<AdminIdentity> = token => getAdminAuth().verifyIdToken(token, true),
): Promise<AdminIdentity> {
  if (!authorization || !/^Bearer \S{1,8192}$/.test(authorization)) {
    throw new ErrorType(401, 'Administrator sign-in required.');
  }
  let identity: AdminIdentity;
  try { identity = await verify(authorization.slice(7)); }
  catch { throw new ErrorType(401, 'Your session is invalid or expired. Please sign in again.'); }
  if (identity.admin !== true) throw new ErrorType(403, 'Administrator permission required.');
  return identity;
}
