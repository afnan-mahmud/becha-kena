import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, ImageUp, RotateCcw } from 'lucide-react';
import './CameraCapture.css';

interface CameraCaptureProps {
  onCapture: (file: File | null) => void;
  facingMode?: 'user' | 'environment';
}

export const CameraCapture = ({ onCapture, facingMode = 'user' }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsLive(false);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      streamRef.current = stream;
      setHasError(false);
      setIsLive(true);
    } catch {
      setHasError(true);
    }
  };

  // Attach the stream once the <video> is mounted
  useEffect(() => {
    if (isLive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isLive, capturedImage]);

  useEffect(() => {
    startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // JPEG works in every browser and keeps faces sharp for manual review
    canvas.toBlob((blob) => {
      if (!blob) return;
      setCapturedImage(URL.createObjectURL(blob));
      stopCamera();
      onCapture(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => {
    if (capturedImage) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    onCapture(null);
    startCamera();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;
    setCapturedImage(URL.createObjectURL(file));
    stopCamera();
    onCapture(file);
  };

  return (
    <div className="camera-capture">
      <div className="camera-box">
        {capturedImage ? (
          <img src={capturedImage} alt="তোলা সেলফি" className="camera-media" />
        ) : hasError ? (
          <div className="camera-fallback">
            <ImageUp size={40} />
            <p>ক্যামেরা চালু করা যায়নি। ফোন থেকে একটি পরিষ্কার সেলফি আপলোড করুন।</p>
            <label className="btn btn-outline btn-sm">
              <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" hidden onChange={handleFileUpload} />
              ছবি নির্বাচন করুন
            </label>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="camera-media camera-media--mirror" />
            <div className="camera-oval" aria-hidden="true" />
            <p className="camera-hint">মুখ ডিম্বাকৃতির ভেতরে রাখুন</p>
          </>
        )}
        <canvas ref={canvasRef} hidden />
      </div>

      <div className="camera-controls">
        {!capturedImage && !hasError && (
          <button type="button" className="camera-shutter" onClick={handleCapture} aria-label="ছবি তুলুন" disabled={!isLive}>
            <Camera size={24} />
          </button>
        )}
        {capturedImage && (
          <button type="button" className="btn btn-outline btn-sm" onClick={handleRetake}>
            <RotateCcw size={16} /> আবার তুলুন
          </button>
        )}
      </div>
    </div>
  );
};
