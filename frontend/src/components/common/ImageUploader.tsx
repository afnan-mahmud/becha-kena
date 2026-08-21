import { useState, useRef, type ChangeEvent, type DragEvent, type Dispatch, type SetStateAction } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import './ImageUploader.css';

export interface ImageFile {
  file: File;
  previewUrl: string;
  progress: number;
  uploadedUrl?: string;
  error?: string;
}

interface ImageUploaderProps {
  maxFiles?: number;
  images: ImageFile[];
  onImagesChange: Dispatch<SetStateAction<ImageFile[]>>;
}

export const ImageUploader = ({ maxFiles = 5, images, onImagesChange }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    const remainingSlots = maxFiles - images.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);

    const newImageFiles: ImageFile[] = filesToProcess.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }));

    const updatedImages = [...images, ...newImageFiles];
    onImagesChange(updatedImages);

    // Mock upload process for each new file
    newImageFiles.forEach((imageFile) => {
      simulateUpload(imageFile);
    });
  };

  const simulateUpload = (imageFile: ImageFile) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 10;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        onImagesChange(prev => {
          const newArr = [...prev];
          // We find by previewUrl since index might shift if user deletes while uploading
          const currentIdx = newArr.findIndex(img => img.previewUrl === imageFile.previewUrl);
          if (currentIdx !== -1) {
            newArr[currentIdx] = {
              ...newArr[currentIdx],
              progress: 100,
              uploadedUrl: newArr[currentIdx].previewUrl // Mock uploaded URL
            };
          }
          return newArr;
        });
      } else {
        onImagesChange(prev => {
          const newArr = [...prev];
          const currentIdx = newArr.findIndex(img => img.previewUrl === imageFile.previewUrl);
          if (currentIdx !== -1) {
            newArr[currentIdx] = {
              ...newArr[currentIdx],
              progress
            };
          }
          return newArr;
        });
      }
    }, 300);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (previewUrl: string) => {
    const updatedImages = images.filter(img => img.previewUrl !== previewUrl);
    onImagesChange(updatedImages);
    URL.revokeObjectURL(previewUrl);
  };

  return (
    <div className="image-uploader">
      {images.length < maxFiles && (
        <div 
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">
            <Upload size={32} />
          </div>
          <p className="upload-text">ছবি আপলোড করতে এখানে ড্র্যাগ করুন</p>
          <p className="upload-subtext">অথবা ব্রাউজ করতে ক্লিক করুন (সর্বোচ্চ {maxFiles}টি)</p>
          <button type="button" className="btn btn-outline" onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}>
            ছবি নির্বাচন করুন
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            accept="image/jpeg, image/png, image/webp" 
            multiple 
            className="hidden-input"
          />
        </div>
      )}

      {images.length > 0 && (
        <div className="uploaded-images-grid">
          {images.map((img, idx) => (
            <div key={img.previewUrl} className="uploaded-image-card">
              <div className="image-preview">
                <img src={img.previewUrl} alt={`Upload ${idx + 1}`} />
                <button 
                  type="button" 
                  className="remove-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(img.previewUrl);
                  }}
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
              
              {img.progress < 100 && (
                <div className="upload-progress-container">
                  <div className="upload-progress-bar" style={{ width: `${img.progress}%` }}></div>
                </div>
              )}
              
              {img.error && (
                <div className="upload-error">
                  <AlertCircle size={14} />
                  <span>{img.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
