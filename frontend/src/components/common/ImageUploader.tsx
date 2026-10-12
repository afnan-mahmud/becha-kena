import { useRef, useState, type ChangeEvent, type DragEvent, type Dispatch, type SetStateAction } from 'react';
import { ImagePlus, X, AlertCircle, RotateCw, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../services/media.service';
import { formatNumber, getErrorMessage } from '../../utils/formatters';
import './ImageUploader.css';

export interface ImageFile {
  id: string;
  /** Missing for images that were already uploaded (edit mode) */
  file?: File;
  previewUrl: string;
  progress: number; // 0 = waiting, 50 = uploading, 100 = done
  uploadedUrl?: string;
  error?: string;
}

interface ImageUploaderProps {
  maxFiles?: number;
  images: ImageFile[];
  onImagesChange: Dispatch<SetStateAction<ImageFile[]>>;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

export const fromUploadedUrls = (urls: string[]): ImageFile[] =>
  urls.map((url, i) => ({ id: `existing-${i}-${url}`, previewUrl: url, progress: 100, uploadedUrl: url }));

export const ImageUploader = ({ maxFiles = 10, images, onImagesChange }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patch = (id: string, changes: Partial<ImageFile>) =>
    onImagesChange((prev) => prev.map((img) => (img.id === id ? { ...img, ...changes } : img)));

  const upload = async (image: ImageFile) => {
    if (!image.file) return;
    patch(image.id, { progress: 50, error: undefined });
    try {
      const url = await uploadImage(image.file, 'listings');
      patch(image.id, { progress: 100, uploadedUrl: url });
    } catch (err) {
      patch(image.id, { progress: 0, error: getErrorMessage(err, 'আপলোড ব্যর্থ') });
    }
  };

  const processFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const valid = list.filter((f) => ACCEPTED.includes(f.type) && f.size <= MAX_SIZE_MB * 1024 * 1024);
    if (valid.length < list.length) {
      toast.error(`শুধু JPG/PNG/WebP ছবি, প্রতিটি সর্বোচ্চ ${formatNumber(MAX_SIZE_MB)}MB`);
    }

    const slots = maxFiles - images.length;
    if (valid.length > slots) toast.error(`সর্বোচ্চ ${formatNumber(maxFiles)}টি ছবি দেওয়া যাবে`);

    const added: ImageFile[] = valid.slice(0, Math.max(slots, 0)).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }));

    if (added.length === 0) return;
    onImagesChange((prev) => [...prev, ...added]);
    added.forEach(upload);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemove = (image: ImageFile) => {
    onImagesChange((prev) => prev.filter((img) => img.id !== image.id));
    if (image.file) URL.revokeObjectURL(image.previewUrl);
  };

  const makeCover = (image: ImageFile) =>
    onImagesChange((prev) => [image, ...prev.filter((img) => img.id !== image.id)]);

  return (
    <div className="image-uploader">
      <div className="uploaded-images-grid">
        {images.map((img, idx) => (
          <div key={img.id} className={`uploaded-image-card ${img.error ? 'has-error' : ''}`}>
            <img src={img.previewUrl} alt={`ছবি ${idx + 1}`} />
            {idx === 0 && <span className="cover-tag">কভার ছবি</span>}

            {img.progress > 0 && img.progress < 100 && (
              <div className="upload-overlay"><span className="spinner" /></div>
            )}

            {img.error && (
              <div className="upload-overlay upload-overlay--error">
                <AlertCircle size={18} />
                <button type="button" className="btn btn-sm btn-outline" onClick={() => upload(img)}>
                  <RotateCw size={14} /> আবার চেষ্টা
                </button>
              </div>
            )}

            <div className="image-actions">
              {idx > 0 && img.progress === 100 && (
                <button type="button" onClick={() => makeCover(img)} aria-label="কভার বানান" title="কভার বানান">
                  <Star size={14} />
                </button>
              )}
              <button type="button" onClick={() => handleRemove(img)} aria-label="ছবি সরান" title="সরান">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        {images.length < maxFiles && (
          <div
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
          >
            <ImagePlus size={28} />
            <span className="upload-text">ছবি যোগ করুন</span>
            <span className="upload-subtext">{formatNumber(images.length)}/{formatNumber(maxFiles)}</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept={ACCEPTED.join(',')}
              multiple
              hidden
            />
          </div>
        )}
      </div>
    </div>
  );
};
