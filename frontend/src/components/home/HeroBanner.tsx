import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ShieldCheck, Flame } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './HeroBanner.css';

export const HeroBanner = () => {
  const slides = [
    {
      id: 1,
      title: "বেচা-কেনায় স্বাগতম!",
      subtitle: "১০০% ভেরিফাইড ইউজার",
      gradient: "linear-gradient(135deg, #2D5BFF 0%, #AA3BFF 100%)",
    },
    {
      id: 2,
      title: "আপনার পুরাতন জিনিস বিক্রি করুন",
      subtitle: "সহজে, নিরাপদে",
      gradient: "linear-gradient(135deg, #10B981 0%, #22C55E 100%)",
    },
    {
      id: 3,
      title: "নতুন অফার!",
      subtitle: "এই সপ্তাহের সেরা ডিল দেখুন",
      gradient: "linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%)",
    }
  ];

  return (
    <section className="hero-banner">
      <div className="hero-carousel">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          className="mySwiper"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div 
                className="slide-content"
                style={{ background: slide.gradient }}
              >
                <div className="slide-text">
                  <h2>{slide.title}</h2>
                  <p>{slide.subtitle}</p>
                  <button className="slide-cta">ব্রাউজ করুন</button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="hero-side-cards">
        <div className="promo-card card-verified">
          <div className="card-bg"></div>
          <div className="card-overlay"></div>
          <div className="card-content">
            <ShieldCheck size={32} />
            <h3>ভেরিফাইড সেলার থেকে কিনুন</h3>
          </div>
        </div>
        <div className="promo-card card-deals">
          <div className="card-bg"></div>
          <div className="card-overlay"></div>
          <div className="card-content">
            <Flame size={32} />
            <h3>আজকের সেরা ডিল</h3>
          </div>
        </div>
      </div>
    </section>
  );
};
