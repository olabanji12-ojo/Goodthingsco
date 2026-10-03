// This module is aliased ONLY by the separate tests/orders/uiServer.ts harness.
export const useAdminAuth = () => ({ user: { email: 'preview@example.com', uid: 'preview-admin' },
  isAuthorizedAdmin: true, loading: false, logout: async () => {} });
