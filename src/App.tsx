/**
 * App — Good Things Co. Refinement
 *
 * Root application component.
 * Initialises Lenis smooth scrolling and provides routing between
 * the Homepage and Shop page.
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useLenis } from './lib/lenis';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import LookbookPage from './pages/LookbookPage';
import CorporatePage from './pages/CorporatePage';
import CreatePage from './pages/CreatePage';
import EditPage from './pages/EditPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import AboutPage from './pages/AboutPage';

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
        {/* Fallback route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
