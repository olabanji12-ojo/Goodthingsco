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
import LookbookPage from './pages/LookbookPage';
import CorporatePage from './pages/CorporatePage';
import CreatePage from './pages/CreatePage';
import EditPage from './pages/EditPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import AboutPage from './pages/AboutPage';
import DevTestPage from './pages/DevTestPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductNewPage from './pages/admin/AdminProductNewPage';
import AdminArchivedPage from './pages/admin/AdminArchivedPage';
import AdminProductEditPage from './pages/admin/AdminProductEditPage';

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
        <Route path="/dev-test" element={<DevTestPage />} />

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
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductNewPage />} />
          <Route path="products/archived" element={<AdminArchivedPage />} />
          <Route path="products/:productId/edit" element={<AdminProductEditPage />} />
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
