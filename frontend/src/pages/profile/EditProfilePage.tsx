import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import { updateProfile } from '../../services/user.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import './EditProfilePage.css';

interface EditProfileFormData {
  displayName: string;
}

export const EditProfilePage = () => {
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditProfileFormData>({
    defaultValues: {
      displayName: user?.displayName || ''
    }
  });

  // If user state updates after mount, reset form
  useEffect(() => {
    if (user) {
      reset({ displayName: user.displayName || '' });
    }
  }, [user, reset]);

  if (!user) {
    return <LoadingSpinner fullScreen />;
  }

  const onSubmit = async (data: EditProfileFormData) => {
    try {
      await updateProfile({ displayName: data.displayName });
      await fetchUser(); // Refresh user data in store
      toast.success('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      navigate('/profile');
    } catch (error) {
      toast.error('প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="edit-profile-page container">
      <div className="edit-profile-card">
        <h1>প্রোফাইল সম্পাদনা</h1>
        
        <form className="edit-profile-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label" htmlFor="displayName">
              ডিসপ্লে নেম (প্রদর্শিত নাম)
            </label>
            <input
              id="displayName"
              className={`form-input ${errors.displayName ? 'error' : ''}`}
              placeholder="আপনার নাম লিখুন"
              {...register('displayName', { 
                required: 'ডিসপ্লে নেম আবশ্যক',
                minLength: { value: 2, message: 'নাম অন্তত ২ অক্ষরের হতে হবে' },
                maxLength: { value: 30, message: 'নাম সর্বোচ্চ ৩০ অক্ষরের হতে পারবে' }
              })}
            />
            {errors.displayName && <span className="form-error">{errors.displayName.message}</span>}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => navigate('/profile')}
              disabled={isSubmitting}
            >
              বাতিল করুন
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
