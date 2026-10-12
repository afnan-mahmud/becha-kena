import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ListingForm } from '../../components/listing/ListingForm';
import { SEOHead } from '../../components/common/SEOHead';
import { createListing, type ListingPayload } from '../../services/listing.service';
import { getErrorMessage } from '../../utils/formatters';
import './CreateListingPage.css';

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (payload: ListingPayload) => {
    try {
      await createListing(payload);
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast.success('বিজ্ঞাপন জমা হয়েছে! অনুমোদনের পর সবাই দেখতে পাবে।', { duration: 5000 });
      navigate('/dashboard/my-listings?tab=pending');
    } catch (error) {
      toast.error(getErrorMessage(error, 'বিজ্ঞাপন পোস্ট করা যায়নি। আবার চেষ্টা করুন।'));
    }
  };

  return (
    <div className="listing-form-page container">
      <SEOHead title="ফ্রি বিজ্ঞাপন দিন — বেচা-কেনা" />
      <header className="listing-form-page__head">
        <span className="section-eyebrow">সম্পূর্ণ ফ্রি</span>
        <h1>বিজ্ঞাপন দিন</h1>
        <p>৪টি সহজ ধাপে আপনার পণ্য যাচাইকৃত ক্রেতাদের সামনে তুলে ধরুন।</p>
      </header>
      <ListingForm submitLabel="বিজ্ঞাপন পোস্ট করুন" onSubmit={handleSubmit} />
    </div>
  );
};
