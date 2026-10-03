import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from '../../../src/contexts/CartContext';
import AdminLayout from '../../../src/components/admin/AdminLayout';
import AdminOrdersPage from '../../../src/pages/admin/AdminOrdersPage';
import AdminOrderDetailsPage from '../../../src/pages/admin/AdminOrderDetailsPage';
import TrackOrderPage from '../../../src/pages/TrackOrderPage';
import '../../../src/index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><CartProvider>
  <div className="bg-amber-100 text-amber-900 text-center text-xs p-2">Test preview · fictional data · no live orders or email</div>
  <Routes><Route path="/admin" element={<AdminLayout />}><Route path="orders" element={<AdminOrdersPage />} /><Route path="orders/:orderId" element={<AdminOrderDetailsPage />} /></Route>
    <Route path="/track-order" element={<TrackOrderPage />} /><Route path="*" element={<Navigate to="/admin/orders" />} /></Routes>
</CartProvider></BrowserRouter></React.StrictMode>);

