import React, { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { CategoryNav } from './CategoryNav';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import './Layout.css'; // Optional: if specific layout styles are needed

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
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
};
