import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageCarousel = ({ images, alt, height = 'h-48', showCounter = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images && images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className={`w-full ${height} flex items-center justify-center text-gray-400`}>No Image</div>
    );
  }

  return (
    <div className={`relative ${height} overflow-hidden`}>
      <img 
        src={images[currentImageIndex]} 
        alt={alt} 
        className="w-full h-full object-cover transition-transform duration-500" 
      />
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-md z-10 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-md z-10 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {showCounter ? (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          ) : (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
