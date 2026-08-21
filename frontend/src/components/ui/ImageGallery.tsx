import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

import './ImageGallery.css';

interface ImageGalleryProps {
  images: string[];
  isSold?: boolean;
}

export const ImageGallery = ({ images, isSold = false }: ImageGalleryProps) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="image-gallery-placeholder">
        <img src="https://via.placeholder.com/800x600?text=No+Images" alt="No images" />
        {isSold && <div className="sold-overlay">বিক্রি হয়ে গেছে</div>}
      </div>
    );
  }

  return (
    <div className="image-gallery-container">
      <div className="main-image-wrapper">
        <Swiper
          style={{
            '--swiper-navigation-color': '#fff',
            '--swiper-pagination-color': '#fff',
          } as React.CSSProperties}
          spaceBetween={10}
          navigation={true}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          modules={[FreeMode, Navigation, Thumbs]}
          className="main-swiper"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index}>
              <div className="image-zoom-container">
                <img src={img} alt={`Gallery image ${index + 1}`} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {isSold && <div className="sold-overlay">বিক্রি হয়ে গেছে</div>}
      </div>

      {images.length > 1 && (
        <div className="thumbnail-wrapper">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            modules={[FreeMode, Navigation, Thumbs]}
            className="thumbnail-swiper"
            breakpoints={{
              640: { slidesPerView: 5 },
              768: { slidesPerView: 6 }
            }}
          >
            {images.map((img, index) => (
              <SwiperSlide key={index}>
                <div className="thumb-container">
                  <img src={img} alt={`Thumbnail ${index + 1}`} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};
