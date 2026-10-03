import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { createOrderManagement } from '../../server/orders/service';
import { createOrderHttp } from '../../server/orders/http';
import { createNotificationService } from '../../server/services/notificationService';
import { createEmailService } from '../../server/services/emailService';
import { getEmailConfig } from '../../server/email/config';
import { managedOrder, memoryRepository } from './memory';

async function main() {
  const first = managedOrder();
  const second = managedOrder(); second.id = 'order-2'; second.orderNumber = 'GTC-20261001-OLD2';
  second.customer.fullName = 'Tomi Example'; second.customer.email = 'tomi@example.com';
  second.createdAt = '2026-10-01T10:00:00Z'; second.orderStatus = 'pending-payment'; second.payment.status = 'pending';
  const memory = memoryRepository([first, second]);
  const service = createOrderManagement({ repository: memory.repository,
    verify: async token => ({ uid: 'preview-admin', admin: token === 'preview-admin' }),
    notify: createNotificationService(createEmailService({ config: () => getEmailConfig({}) })),
  });
  const handler = createOrderHttp(service);
  const server = await createServer({ configFile: false, root: resolve('tests/orders/ui'), publicDir: false,
    plugins: [react(), { name: 'fictional-order-preview', configureServer(server) {
      server.middlewares.use(async (req, res, next) => { if (!await handler(req, res)) next(); });
    } }],
    resolve: { alias: [
      { find: /^.*\/contexts\/AdminAuthContext$/, replacement: resolve('tests/orders/ui/auth.tsx') },
      { find: /^.*\/lib\/firebase$/, replacement: resolve('tests/orders/ui/firebase.ts') },
    ] },
    server: { host: '127.0.0.1', port: 5190, strictPort: true, fs: { allow: [process.cwd()] } },
  });
  await server.listen(); server.printUrls();
  console.info('FICTIONAL DATA ONLY. Admin preview: /admin/orders. Tracking: GTC-20261002-DEMO + customer@example.com or 09012345678. No live Firebase or email.');
}
void main();
