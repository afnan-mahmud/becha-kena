import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { CategoryNav } from './CategoryNav';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import './Layout.css';

export const Layout = ({ children }: { children?: ReactNode }) => (
  <div className="app-layout">
    <a href="#main-content" className="skip-link">মূল কন্টেন্টে যান</a>
    <AnnouncementBar />
    <Header />
    <CategoryNav />

    <main id="main-content" className="main-content">
      {children || <Outlet />}
    </main>

    <Footer />
    <MobileBottomNav />
  </div>
);
