import { HeroBanner } from '../../components/home/HeroBanner';
import { TrustBar } from '../../components/home/TrustBar';
import { CategoryCircles } from '../../components/home/CategoryCircles';
import { HotDeals } from '../../components/home/HotDeals';
import { PromoBanner } from '../../components/home/PromoBanner';
import { CategorySection } from '../../components/home/CategorySection';
import { SidebarSpecialItems } from '../../components/home/SidebarSpecialItems';
import { Shirt, Smartphone, Monitor } from 'lucide-react';
import { SEOHead } from '../../components/common/SEOHead';
import './HomePage.css';

export const HomePage = () => {
  return (
    <div className="home-page container">
      <SEOHead 
        title="Becha-Kena — বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস" 
        description="বেচা-কেনা — বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস। ১০০% ভেরিফাইড ইউজার। NID যাচাই ছাড়া কেনা-বেচা নয়।"
      />
      <HeroBanner />
      <TrustBar />
      <CategoryCircles />
      
      <div className="home-content">
        <aside className="home-sidebar">
          <SidebarSpecialItems />
        </aside>
        <main className="home-main">
          <HotDeals />
          <PromoBanner 
            title="৩য় বর্ষপূর্তি সেল — ৫০% ছাড়!" 
            subtitle="সাইটজুড়ে যেকোনো কেনাকাটায়" 
            bgGradient="linear-gradient(135deg, #AA3BFF 0%, #2D5BFF 100%)" 
            ctaText="অফার লুফে নিন" 
            ctaLink="/listings?special=anniversary" 
          />
          <CategorySection 
            title="ফ্যাশন ও এক্সেসরিজ" 
            category="Fashion" 
            icon={<Shirt size={20} />} 
          />
          <CategorySection 
            title="মোবাইল ফোন" 
            category="Mobile" 
            icon={<Smartphone size={20} />} 
          />
          <CategorySection 
            title="ইলেকট্রনিক্স" 
            category="Electronics" 
            icon={<Monitor size={20} />} 
          />
        </main>
      </div>
    </div>
  );
};
