"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';


interface MobileCameraFlowProps {
  onComplete: (photos: File[]) => void;
  onCancel: () => void;
  serviceType: 'landscaping' | 'dump';
}

export default function MobileCameraFlow({ onComplete, onCancel, serviceType }: MobileCameraFlowProps) {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const steps = serviceType === 'landscaping' 
    ? [
        { label: "Front Yard", description: "Stand at the curb and capture the full front." },
        { label: "Left Side", description: "Capture the left side/pathway." },
        { label: "Right Side", description: "Capture the right side/driveway." },
        { label: "Back Yard", description: "Stand at the back door/patio." },
        { label: "Special Features", description: "Pool, Shed, or Garden Beds." }
      ]
    : [
        { label: "Main Pile", description: "Capture the entire pile of items." },
        { label: "Close Up 1", description: "Get close to detailed items (electronics, hazmat)." },
        { label: "Wide Angle", description: "Show access path/driveway." }
      ];

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newPhotos = [...photos, file];
      const newPreviews = [...previews, URL.createObjectURL(file)];
      
      setPhotos(newPhotos);
      setPreviews(newPreviews);
      
      // Auto-advance
      if (step < steps.length - 1) {
        setStep(step + 1);
      }
    }
  };

  const handleFinish = () => {
    onComplete(photos);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-4 text-white">
      <div className="w-full flex justify-between items-center p-2">
        <button onClick={onCancel} className="text-gray-300 text-sm">Cancel</button>
        <div className="font-bold text-lg">{step + 1} / {steps.length}</div>
        <button 
            onClick={handleFinish} 
            className="text-emerald-400 font-bold"
            disabled={photos.length === 0}
        >
            Done
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{steps[step]?.label || "Extra Photo"}</h2>
            <p className="text-gray-300">{steps[step]?.description || "Any additional details."}</p>
        </div>

        {/* Viewfinder / Preview */}
        <div 
            className="w-full aspect-[3/4] bg-gray-900 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden relative"
            onClick={() => inputRef.current?.click()}
        >
            {previews[step] ? (
                <Image 
                    src={previews[step]} 
                    alt="Current shot" 
                    fill 
                    className="object-cover"
                />
            ) : (
                <div className="text-gray-500 flex flex-col items-center">
                    <span className="text-4xl mb-2">📷</span>
                    <span>Tap to Capture</span>
                </div>
            )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md pb-8">
        <input 
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCapture}
        />
        
        <button 
            onClick={() => inputRef.current?.click()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-full text-lg shadow-lg flex items-center justify-center gap-2"
        >
            {previews[step] ? 'Retake Photo' : 'Take Photo'}
        </button>

        {photos.length > 0 && (
             <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                 {previews.map((src, i) => (
                     <div key={i} className={`relative w-16 h-16 flex-shrink-0 rounded border-2 ${i === step ? 'border-emerald-500' : 'border-transparent'}`}>
                         <Image src={src} alt="" fill className="object-cover rounded" />
                     </div>
                 ))}
             </div>
        )}
      </div>
    </div>
  );
}
