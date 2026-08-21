import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Smartphone, 
  Laptop, 
  Car, 
  Sofa, 
  Bike, 
  Shirt, 
  Heart, 
  Utensils, 
  Plane, 
  Dumbbell, 
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import { StepIndicator } from '../../components/common/StepIndicator';
import { ImageUploader, type ImageFile } from '../../components/common/ImageUploader';
import { DIVISIONS, DISTRICTS, THANAS } from '../../utils/locations';
import { ListingCategory, ListingCondition } from '../../types';
import { getListingById } from '../../services/listing.service';
import './CreateListingPage.css'; // Reusing CSS

// Icons mapping for categories
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  [ListingCategory.Mobile]: <Smartphone size={32} />,
  [ListingCategory.Electronics]: <Laptop size={32} />,
  [ListingCategory.Vehicles]: <Car size={32} />,
  [ListingCategory.Furniture]: <Sofa size={32} />,
  [ListingCategory.Cycles]: <Bike size={32} />,
  [ListingCategory.Fashion]: <Shirt size={32} />,
  [ListingCategory.HealthBeauty]: <Heart size={32} />,
  [ListingCategory.FoodRestaurant]: <Utensils size={32} />,
  [ListingCategory.Travel]: <Plane size={32} />,
  [ListingCategory.SportsOutdoors]: <Dumbbell size={32} />,
  [ListingCategory.Other]: <MoreHorizontal size={32} />,
};

interface ListingFormData {
  category: string;
  condition: string;
  title: string;
  description: string;
  price: string;
  division: string;
  district: string;
  thana: string;
  addressLine: string;
  hidePhoneNumber: boolean;
}

const STEPS = ['ক্যাটাগরি ও অবস্থা', 'বিস্তারিত বিবরণ', 'ছবি আপলোড', 'লোকেশন ও আপডেট'];

export const EditListingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch listing
  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingById(id as string),
    enabled: !!id
  });

  const listing = data?.data;

  const { register, control, handleSubmit, watch, formState: { errors }, trigger, reset } = useForm<ListingFormData>({
    defaultValues: {
      hidePhoneNumber: false,
    }
  });

  // Populate form when data loads
  useEffect(() => {
    if (listing) {
      reset({
        category: listing.category,
        condition: listing.condition,
        title: listing.title,
        description: listing.description,
        price: listing.price.toString(),
        division: listing.location.division,
        district: listing.location.district,
        thana: listing.location.thana,
        addressLine: listing.location.addressLine || '',
        hidePhoneNumber: listing.hidePhoneNumber,
      });

      // Load existing images
      if (listing.images && listing.images.length > 0) {
        const loadedImages: ImageFile[] = listing.images.map(url => ({
          // Mocking File object since we don't have the original file
          file: new File([''], 'existing-image.jpg', { type: 'image/jpeg' }), 
          previewUrl: url,
          progress: 100,
          uploadedUrl: url
        }));
        setImages(loadedImages);
      }
    }
  }, [listing, reset]);

  const selectedCategory = watch('category');
  const selectedCondition = watch('condition');
  const selectedDivision = watch('division');
  const selectedDistrict = watch('district');
  const titleVal = watch('title') || '';
  const descVal = watch('description') || '';
  const initialTitle = listing?.title || '';
  const initialPrice = listing?.price.toString() || '';
  
  const isMajorChange = titleVal !== initialTitle || watch('price') !== initialPrice;

  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 0) {
      isValid = await trigger(['category', 'condition']);
    } else if (currentStep === 1) {
      isValid = await trigger(['title', 'description', 'price']);
    } else if (currentStep === 2) {
      if (images.length === 0) {
        toast.error('অন্তত ১টি ছবি আপলোড করুন');
        return;
      }
      if (images.some(img => img.progress < 100)) {
        toast.error('ছবি আপলোড সম্পন্ন হওয়ার জন্য অপেক্ষা করুন');
        return;
      }
      isValid = true;
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const onSubmit = async (formData: ListingFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Updating data:', { ...formData, images: images.map(i => i.uploadedUrl) });
      
      if (isMajorChange) {
        toast.success('বিজ্ঞাপন আপডেট করা হয়েছে। বড় পরিবর্তনের কারণে এটি পুনরায় পর্যালোচনার জন্য পাঠানো হয়েছে।');
      } else {
        toast.success('বিজ্ঞাপন সফলভাবে আপডেট করা হয়েছে।');
      }
      
      navigate('/dashboard/my-listings');
    } catch (error) {
      toast.error('বিজ্ঞাপন আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>লোড হচ্ছে...</div>;
  }

  if (error || !listing) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>বিজ্ঞাপনটি পাওয়া যায়নি</div>;
  }

  return (
    <div className="create-listing-page container">
      <div className="create-listing-header">
        <h1>বিজ্ঞাপন সম্পাদনা করুন</h1>
        <p>আপনার বিজ্ঞাপনের তথ্য আপডেট করুন</p>
      </div>

      <div className="create-listing-container">
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <form onSubmit={handleSubmit(onSubmit)} className="create-listing-form">
          {/* STEP 1: Category & Condition */}
          {currentStep === 0 && (
            <div className="form-step slide-in">
              <div className="form-group">
                <label>ক্যাটাগরি নির্বাচন করুন <span className="required">*</span></label>
                <div className="category-grid">
                  {Object.values(ListingCategory).map(cat => (
                    <label key={cat} className={`category-card ${selectedCategory === cat ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        value={cat} 
                        {...register('category', { required: 'ক্যাটাগরি নির্বাচন করুন' })} 
                        className="hidden-radio"
                      />
                      <div className="cat-icon">{CATEGORY_ICONS[cat]}</div>
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                {errors.category && <span className="error-text">{errors.category.message}</span>}
              </div>

              <div className="form-group mt-5">
                <label>পণ্যের অবস্থা <span className="required">*</span></label>
                <div className="condition-options">
                  {Object.entries(ListingCondition).map(([key, val]) => (
                    <label key={val} className={`condition-card ${selectedCondition === val ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        value={val} 
                        {...register('condition', { required: 'পণ্যের অবস্থা নির্বাচন করুন' })} 
                        className="hidden-radio"
                      />
                      <span>
                        {key === 'New' ? 'নতুন' : key === 'LikeNew' ? 'প্রায় নতুন' : 'ব্যবহৃত'}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.condition && <span className="error-text">{errors.condition.message}</span>}
              </div>

              <div className="form-actions right">
                <button type="button" className="btn btn-primary" onClick={nextStep}>পরবর্তী</button>
              </div>
            </div>
          )}

          {/* STEP 2: Details */}
          {currentStep === 1 && (
            <div className="form-step slide-in">
              <div className="form-group">
                <label>বিজ্ঞাপনের শিরোনাম <span className="required">*</span></label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="আপনার পণ্যের নাম লিখুন (যেমন: iPhone 13 Pro 128GB)"
                  {...register('title', { 
                    required: 'শিরোনাম আবশ্যক',
                    minLength: { value: 10, message: 'কমপক্ষে ১০টি অক্ষর হতে হবে' },
                    maxLength: { value: 80, message: 'সর্বোচ্চ ৮০টি অক্ষর হতে পারে' }
                  })}
                />
                <div className="char-counter">
                  {errors.title ? <span className="error-text">{errors.title.message}</span> : <span></span>}
                  <span>{titleVal.length}/80</span>
                </div>
              </div>

              <div className="form-group">
                <label>বিস্তারিত বিবরণ <span className="required">*</span></label>
                <textarea 
                  className="input" 
                  rows={6}
                  placeholder="পণ্যের বৈশিষ্ট্য, কেনা তারিখ, ওয়ারেন্টি আছে কিনা ইত্যাদি বিস্তারিত লিখুন..."
                  {...register('description', { 
                    required: 'বিবরণ আবশ্যক',
                    minLength: { value: 50, message: 'কমপক্ষে ৫০টি অক্ষর হতে হবে' },
                    maxLength: { value: 500, message: 'সর্বোচ্চ ৫০০টি অক্ষর হতে পারে' }
                  })}
                ></textarea>
                <div className="char-counter">
                  {errors.description ? <span className="error-text">{errors.description.message}</span> : <span></span>}
                  <span>{descVal.length}/500</span>
                </div>
              </div>

              <div className="form-group">
                <label>মূল্য (৳) <span className="required">*</span></label>
                <div className="price-input-wrapper">
                  <span className="price-prefix">৳</span>
                  <input 
                    type="number" 
                    className="input price-input" 
                    placeholder="0"
                    {...register('price', { 
                      required: 'মূল্য আবশ্যক',
                      min: { value: 1, message: 'সঠিক মূল্য দিন' }
                    })}
                  />
                </div>
                {errors.price && <span className="error-text">{errors.price.message}</span>}
              </div>

              <div className="form-actions space-between">
                <button type="button" className="btn btn-outline" onClick={prevStep}>আগের ধাপ</button>
                <button type="button" className="btn btn-primary" onClick={nextStep}>পরবর্তী</button>
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {currentStep === 2 && (
            <div className="form-step slide-in">
              <div className="form-group">
                <label>ছবি আপলোড করুন (সর্বোচ্চ ৫টি) <span className="required">*</span></label>
                <p className="help-text mb-3">ভালো মানের আসল ছবি আপলোড করুন। প্রথম ছবিটি মূল ছবি হিসেবে দেখানো হবে।</p>
                <ImageUploader 
                  maxFiles={5} 
                  images={images} 
                  onImagesChange={setImages} 
                />
              </div>

              <div className="form-actions space-between mt-5">
                <button type="button" className="btn btn-outline" onClick={prevStep}>আগের ধাপ</button>
                <button type="button" className="btn btn-primary" onClick={nextStep}>পরবর্তী</button>
              </div>
            </div>
          )}

          {/* STEP 4: Location & Settings */}
          {currentStep === 3 && (
            <div className="form-step slide-in">
              {isMajorChange && (
                <div className="safety-banner mb-3" style={{ padding: '16px', fontSize: '0.9rem' }}>
                  <AlertTriangle size={20} className="safety-icon" />
                  <div>
                    <strong>সতর্কতা:</strong> আপনি শিরোনাম বা মূল্য পরিবর্তন করেছেন। আপডেট করার পর আপনার বিজ্ঞাপনটি পুনরায় পর্যালোচনার জন্য যাবে।
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>অবস্থান (কোথায় থেকে বিক্রি করছেন?)</label>
                
                <div className="location-grid">
                  <div>
                    <label className="sub-label">বিভাগ <span className="required">*</span></label>
                    <select 
                      className="input" 
                      {...register('division', { required: 'বিভাগ নির্বাচন করুন' })}
                    >
                      <option value="">নির্বাচন করুন</option>
                      {DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
                    </select>
                    {errors.division && <span className="error-text">{errors.division.message}</span>}
                  </div>
                  
                  <div>
                    <label className="sub-label">জেলা <span className="required">*</span></label>
                    <select 
                      className="input" 
                      {...register('district', { required: 'জেলা নির্বাচন করুন' })}
                      disabled={!selectedDivision}
                    >
                      <option value="">নির্বাচন করুন</option>
                      {selectedDivision && DISTRICTS[selectedDivision]?.map(dist => 
                        <option key={dist} value={dist}>{dist}</option>
                      )}
                    </select>
                    {errors.district && <span className="error-text">{errors.district.message}</span>}
                  </div>
                  
                  <div>
                    <label className="sub-label">থানা/এলাকা <span className="required">*</span></label>
                    <select 
                      className="input" 
                      {...register('thana', { required: 'থানা নির্বাচন করুন' })}
                      disabled={!selectedDistrict}
                    >
                      <option value="">নির্বাচন করুন</option>
                      {selectedDistrict && THANAS[selectedDistrict]?.map(th => 
                        <option key={th} value={th}>{th}</option>
                      )}
                    </select>
                    {errors.thana && <span className="error-text">{errors.thana.message}</span>}
                  </div>
                </div>
              </div>

              <div className="form-group mt-3">
                <label className="sub-label">পূর্ণ ঠিকানা (ঐচ্ছিক)</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="যেমন: রোড নং ৭, ব্লক সি, বনানী"
                  {...register('addressLine')}
                />
              </div>

              <div className="map-preview-container">
                <img src="https://via.placeholder.com/600x200?text=Map+Preview+Area" alt="Map Preview" />
              </div>

              <hr className="divider" />

              <div className="form-group">
                <label className="switch-container">
                  <div className="switch-text">
                    <span className="switch-title">ফোন নম্বর লুকান</span>
                    <span className="switch-desc">চালু করলে শুধু চ্যাটে যোগাযোগ করা যাবে</span>
                  </div>
                  <Controller
                    name="hidePhoneNumber"
                    control={control}
                    render={({ field }) => (
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <span className="slider round"></span>
                      </label>
                    )}
                  />
                </label>
              </div>

              <div className="form-actions space-between mt-5">
                <button type="button" className="btn btn-outline" onClick={prevStep} disabled={isSubmitting}>আগের ধাপ</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
