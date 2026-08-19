import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';

export function usePhotoPicker() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage(previewUrl);
    }
  };

  const clearPhoto = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    selectedImage,
    imageFile,
    fileInputRef,
    triggerPhotoClick,
    handleImageChange,
    clearPhoto,
  };
}