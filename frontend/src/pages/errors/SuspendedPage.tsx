import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './NotFoundPage.css';
import './SuspendedPage.css';

export const SuspendedPage = () => {
  const { clearUser } = useAuthStore();

  return (
    <div className="error-page-container">
      <div className="error-page-content">
        <div className="suspended-icon-wrapper">
          <ShieldAlert size={40} />
        </div>
        <h2 className="error-title text-red-600">আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে</h2>
        <p className="error-description">
          আমাদের কমিউনিটি গাইডলাইন লঙ্ঘনের কারণে আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত (Suspended) বা ব্যান (Banned) করা হয়েছে। 
          আপনি যদি মনে করেন এটি একটি ভুল, তাহলে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।
        </p>
        
        <div className="flex flex-col gap-3 w-full mt-4">
          <a href="mailto:support@bechakena.com" className="btn btn-outline flex-center gap-2 w-full justify-center">
            <Mail size={18} />
            সাপোর্টে ইমেইল করুন
          </a>
          <button onClick={clearUser} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-center gap-2 w-full justify-center">
            <LogOut size={18} />
            লগ আউট করুন
          </button>
        </div>
      </div>
    </div>
  );
};
