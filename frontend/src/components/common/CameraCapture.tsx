import { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, RotateCcw } from 'lucide-react';
import './CameraCapture.css';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  facingMode?: 'user' | 'environment';
}

export const CameraCapture = ({ onCapture, facingMode = 'user' }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setStream(mediaStream);
      setHasError(false);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied or unsupported", err);
      setHasError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.webp', { type: 'image/webp' });
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            stopCamera();
            onCapture(file);
          }
        }, 'image/webp', 0.8);
      }
    }
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    startCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      onCapture(file);
    }
  };

  return (
    <div className="camera-capture-container">
      <div className="camera-preview-box">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured preview" className="camera-photo-preview" />
        ) : hasError ? (
          <div className="camera-fallback">
            <ImageIcon size={48} />
            <p>ক্যামেরা চালু করা যায়নি। দয়া করে ছবি আপলোড করুন।</p>
            <label className="btn btn-outline btn-sm">
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              ছবি নির্বাচন করুন
            </label>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="camera-video"
            onLoadedMetadata={() => videoRef.current?.play()}
          />
        )}
        <canvas ref={canvasRef} className="camera-canvas-hidden" />
      </div>

      <div className="camera-controls">
        {!capturedImage && !hasError && (
          <button type="button" className="btn-capture" onClick={handleCapture} aria-label="Capture photo">
            <Camera size={24} />
          </button>
        )}
        
        {capturedImage && (
          <button type="button" className="btn btn-outline flex-center gap-1" onClick={handleRetake}>
            <RotateCcw size={16} /> আবার তুলুন
          </button>
        )}
      </div>
    </div>
  );
};
