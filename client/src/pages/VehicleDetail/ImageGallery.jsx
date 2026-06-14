import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageGallery = ({ images, name, currentImageIndex, setCurrentImageIndex }) => {
  const nextImage = () => {
    if (images?.length > 0) {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (images?.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="bg-gray-200 rounded-3xl overflow-hidden h-[400px] md:h-[500px] relative group">
        {images && images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={name} 
              className="w-full h-full object-cover transition-opacity duration-300" 
            />
            
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">No Image Available</div>
        )}
      </div>
      
      {/* Thumbnails */}
      {images && images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              onClick={() => setCurrentImageIndex(idx)}
              className={`h-20 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${idx === currentImageIndex ? 'border-primary-600 shadow-md ring-2 ring-primary-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt={`${name} view ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
