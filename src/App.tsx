/**
 * App — Good Things Co. Refinement
 *
 * Root application component.
 * Initialises Lenis smooth scrolling and provides routing between
 * the Homepage, storefront pages, and the protected Admin Portal.
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useLenis } from './lib/lenis';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { CartProvider } from './contexts/CartContext';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import TrackOrderPage from './pages/TrackOrderPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailsPage from './pages/admin/AdminOrderDetailsPage';
import LookbookPage from './pages/LookbookPage';
import CorporatePage from './pages/CorporatePage';
import CreatePage from './pages/CreatePage';
import EditPage from './pages/EditPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import AboutPage from './pages/AboutPage';

import { ResumeCheckoutPage } from './pages/ResumeCheckoutPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductNewPage from './pages/admin/AdminProductNewPage';
import AdminArchivedPage from './pages/admin/AdminArchivedPage';
import AdminProductEditPage from './pages/admin/AdminProductEditPage';
import AdminCorporateListPage from './pages/admin/AdminCorporateListPage';
import AdminCorporateDetailPage from './pages/admin/AdminCorporateDetailPage';
import AdminCustomListPage from './pages/admin/AdminCustomListPage';
import AdminCustomDetailPage from './pages/admin/AdminCustomDetailPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminContentPage from './pages/admin/AdminContentPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  useLenis();

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Storefront Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/corporate" element={<CorporatePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/edit" element={<EditPage />} />
        <Route path="/edit/:slug" element={<ArticleDetailPage />} />
        <Route path="/gifts/corporate" element={<CorporatePage />} />
        <Route path="/lookbook" element={<LookbookPage />} />
        <Route path="/horizontal" element={<LookbookPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/product/:slug" element={<ProductDetailPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/resume-checkout" element={<ResumeCheckoutPage />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="/track-order" element={<TrackOrderPage />} />


        {/* Admin Authentication */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Admin Portal */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:orderId" element={<AdminOrderDetailsPage />} />
          <Route path="corporate" element={<AdminCorporateListPage />} />
          <Route path="corporate/:requestId" element={<AdminCorporateDetailPage />} />
          <Route path="custom" element={<AdminCustomListPage />} />
          <Route path="custom/:requestId" element={<AdminCustomDetailPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductNewPage />} />
          <Route path="products/archived" element={<AdminArchivedPage />} />
          <Route path="products/:productId/edit" element={<AdminProductEditPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="content" element={<AdminContentPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
