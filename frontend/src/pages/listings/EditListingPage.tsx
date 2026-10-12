import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ListingForm } from '../../components/listing/ListingForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SEOHead } from '../../components/common/SEOHead';
import { getListingById, updateListing, type ListingPayload } from '../../services/listing.service';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/formatters';
import { getSellerId } from '../../utils/listing';
import './CreateListingPage.css';

export const EditListingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id, 'edit'],
    queryFn: () => getListingById(id as string),
    enabled: !!id,
  });

  const listing = data?.data;

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error || !listing || getSellerId(listing) !== user?.id) {
    return (
      <div className="listing-form-page container">
        <div className="empty-state">
          <h2>বিজ্ঞাপনটি পাওয়া যায়নি</h2>
          <p>এটি মুছে ফেলা হয়েছে অথবা এটি আপনার বিজ্ঞাপন নয়।</p>
          <Link to="/dashboard/my-listings" className="btn btn-primary mt-4">আমার বিজ্ঞাপন</Link>
        </div>
      </div>
    );
  }

  if (!['active', 'pending'].includes(listing.status)) {
    return (
      <div className="listing-form-page container">
        <div className="empty-state">
          <h2>এই বিজ্ঞাপনটি এডিট করা যাবে না</h2>
          <p>শুধু সক্রিয় বা রিভিউতে থাকা বিজ্ঞাপন এডিট করা যায়।</p>
          <Link to="/dashboard/my-listings" className="btn btn-primary mt-4">আমার বিজ্ঞাপন</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (payload: ListingPayload) => {
    try {
      const res = await updateListing(listing.id, payload);
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      if (res.data.status === 'pending' && listing.status === 'active') {
        toast.success('আপডেট হয়েছে। বড় পরিবর্তনের কারণে বিজ্ঞাপনটি আবার রিভিউতে গেছে।', { duration: 5000 });
      } else {
        toast.success('বিজ্ঞাপন আপডেট হয়েছে');
      }
      navigate('/dashboard/my-listings');
    } catch (err) {
      toast.error(getErrorMessage(err, 'আপডেট করা যায়নি। আবার চেষ্টা করুন।'));
    }
  };

  return (
    <div className="listing-form-page container">
      <SEOHead title="বিজ্ঞাপন এডিট — বেচা-কেনা" />
      <header className="listing-form-page__head">
        <h1>বিজ্ঞাপন এডিট করুন</h1>
        <p className="truncate">{listing.title}</p>
      </header>
      <ListingForm initial={listing} submitLabel="পরিবর্তন সেভ করুন" onSubmit={handleSubmit} />
    </div>
  );
};
