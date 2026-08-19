import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Camera, Compass, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useGeolocation } from '../utils/useGeolocation';
import { usePhotoPicker } from '../utils/usePhotoPicker';
import { supabase } from '../utils/supabase';

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { location, isLocating, getLocation } = useGeolocation();
  const {
    selectedImage,
    imageFile, // 1. Added imageFile here
    fileInputRef,
    triggerPhotoClick,
    handleImageChange,
    clearPhoto,
  } = usePhotoPicker();

  if (!isOpen) return null;

  // 2. Defined upload helper function before handleSubmit
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'city_reports');

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dejxdoguu/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Image upload to Cloudinary failed.');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!category) {
      alert('Please select a category.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl = null;

      // Upload photo to Cloudinary if selected
      if (imageFile) {
        uploadedImageUrl = await uploadImageToCloudinary(imageFile);
      }

      // Insert row into Supabase
      const { error } = await supabase.from('reports').insert([
        {
          title: title || null,
          category,
          description,
          location_name: locationName || null,
          latitude: location?.lat ? parseFloat(location.lat) : null,
          longitude: location?.lng ? parseFloat(location.lng) : null,
          image_url: uploadedImageUrl,
          status: 'Pending',
        },
      ]);

      if (error) {
        alert('Error submitting report: ' + error.message);
      } else {
        setTitle('');
        setCategory('');
        setDescription('');
        setLocationName('');
        clearPhoto();
        onClose();
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <span className="text-[10px] font-bold tracking-widest text-[#00684A] uppercase block mb-1">
            NEW SIGNAL
          </span>
          <h2 className="text-2xl font-bold text-[#111814]">
            Report an issue
          </h2>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Category Dropdown */}
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-[#111814] mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short title for the report (e.g. Pothole on 5th Ave)"
              className="w-full bg-[#F7F5EE] border border-transparent rounded-xl px-4 py-3 text-sm text-[#38453D] focus:outline-none focus:border-[#00684A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111814] mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F7F5EE] border border-transparent rounded-xl px-4 py-3 text-sm text-[#38453D] focus:outline-none focus:border-[#00684A]"
            >
              <option value="" disabled>Select a category</option>
              <option value="Roads & Sidewalks">Roads & Sidewalks</option>
              <option value="Lighting">Lighting</option>
              <option value="Waste & Recycling">Waste & Recycling</option>
              <option value="Vandalism">Vandalism</option>
            </select>
          </div>

          {/* Text Description */}
          <div>
            <label className="block text-xs font-semibold text-[#111814] mb-2">
              What's happening?
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue and what city services should know..."
              className="w-full bg-[#F7F5EE] border border-transparent rounded-xl p-4 text-sm text-[#111814] placeholder-[#8C9890] focus:outline-none focus:border-[#00684A] resize-none"
            />
          </div>

          {/* Location name (manual) */}
          <div>
            <label className="block text-xs font-semibold text-[#111814] mb-2">Location name (optional)</label>
            <input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Main St & 3rd Ave, near the library"
              className="w-full bg-[#F7F5EE] border border-transparent rounded-xl px-4 py-3 text-sm text-[#38453D] focus:outline-none focus:border-[#00684A]"
            />
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={triggerPhotoClick}
              className={`flex items-center justify-center gap-2 border text-xs font-medium py-3 px-4 rounded-xl transition-all ${
                selectedImage 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-[#F7F5EE] border-transparent hover:bg-[#EFECE3] text-[#111814]'
              }`}
            >
              {selectedImage ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Photo Added</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-[#111814]" />
                  <span>Add Photo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={getLocation}
              disabled={isLocating}
              className={`flex items-center justify-center gap-2 border text-xs font-medium py-3 px-4 rounded-xl transition-all ${
                location 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-[#F7F5EE] border-transparent hover:bg-[#EFECE3] text-[#111814]'
              }`}
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#00684A]" />
                  <span>Locating...</span>
                </>
              ) : location ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{location.lat}, {location.lng}</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-[#111814]" />
                  <span>Get Location</span>
                </>
              )}
            </button>
          </div>

          {/* Preview Container */}
          {selectedImage && (
            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-[#EBE8DF]">
              <img 
                src={selectedImage} 
                alt="Report preview" 
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00684A] hover:bg-[#00523A] text-white font-medium text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading & Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 rotate-45 -translate-y-0.5" />
                <span>Submit report</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}