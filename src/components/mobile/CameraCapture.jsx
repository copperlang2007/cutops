import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCw, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CameraCapture({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [open, facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert data URL to blob
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        handleClose();
      });
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  const handleClose = () => {
    setCapturedImage(null);
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden dark:bg-slate-900">
        <DialogHeader className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <DialogTitle>Capture Document</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative bg-black">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={switchCamera}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border-white/20 hover:bg-white/20"
                  >
                    <RotateCw className="w-5 h-5 text-white" />
                  </Button>
                  
                  <Button
                    size="icon"
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white hover:bg-white/90 border-4 border-white/30"
                  >
                    <Camera className="w-6 h-6 text-slate-900" />
                  </Button>
                  
                  <div className="w-12 h-12" /> {/* Spacer for symmetry */}
                </div>
              </div>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              
              {/* Review controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={retakePhoto}
                    className="bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  
                  <Button
                    onClick={confirmPhoto}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use Photo
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}