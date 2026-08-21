import { Link } from 'react-router-dom';
import { Smartphone, Monitor, Car, Armchair, Bike, Shirt, HeartPulse, Dumbbell } from 'lucide-react';
import './CategoryCircles.css';

export const CategoryCircles = () => {
  const categories = [
    { id: 1, name: 'মোবাইল', icon: <Smartphone size={28} />, path: '/listings?category=Mobile' },
    { id: 2, name: 'ইলেকট্রনিক্স', icon: <Monitor size={28} />, path: '/listings?category=Electronics' },
    { id: 3, name: 'গাড়ি', icon: <Car size={28} />, path: '/listings?category=Vehicles' },
    { id: 4, name: 'আসবাবপত্র', icon: <Armchair size={28} />, path: '/listings?category=Furniture' },
    { id: 5, name: 'সাইকেল', icon: <Bike size={28} />, path: '/listings?category=Cycles' },
    { id: 6, name: 'ফ্যাশন', icon: <Shirt size={28} />, path: '/listings?category=Fashion' },
    { id: 7, name: 'স্বাস্থ্য', icon: <HeartPulse size={28} />, path: '/listings?category=HealthBeauty' },
    { id: 8, name: 'খেলাধুলা', icon: <Dumbbell size={28} />, path: '/listings?category=SportsOutdoors' },
  ];

  return (
    <section className="category-circles-wrapper">
      <div className="container">
        <div className="category-circles">
          {categories.map((category) => (
            <Link key={category.id} to={category.path} className="category-circle-item">
              <div className="category-circle-icon">
                {category.icon}
              </div>
              <span className="category-circle-name">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
