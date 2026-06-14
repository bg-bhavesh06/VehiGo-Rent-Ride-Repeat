import React from 'react';
import { Upload, XCircle } from 'lucide-react';
import LocationSearchInput from '../../components/LocationSearchInput';

const AddVehicleForm = ({ formData, images, addLoading, onInputChange, onImageChange, onRemoveImage, onSubmit, onLocationSelect }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Add New Vehicle</h2>
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
            <input required type="text" name="name" value={formData.name} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200" placeholder="e.g. Honda City 2022" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input required type="text" name="brand" value={formData.brand} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200" placeholder="e.g. Honda" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select name="type" value={formData.type} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200">
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model / Year</label>
            <input required type="text" name="model" value={formData.model} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
            <input required type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select name="fuelType" value={formData.fuelType} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200">
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
            <input required type="number" name="seatingCapacity" value={formData.seatingCapacity} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Hour (₹)</label>
            <input required type="number" name="pricePerHour" value={formData.pricePerHour} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <LocationSearchInput 
              value={formData.location}
              onLocationSelect={onLocationSelect}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows="3" name="description" value={formData.description} onChange={onInputChange} className="w-full p-3 rounded-xl border border-gray-200"></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Images (Minimum 3 required)</label>
            <div className="flex items-center justify-center w-full mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-primary-500" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> multiple images</p>
                        <p className="text-xs text-gray-400">You can select multiple files at once</p>
                    </div>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={onImageChange} />
                </label>
            </div>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((file, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm h-24">
                    <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={() => onRemoveImage(index)}
                        className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button type="submit" disabled={addLoading} className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl disabled:opacity-50">
          {addLoading ? 'Uploading...' : 'List Vehicle'}
        </button>
      </form>
    </div>
  );
};

export default AddVehicleForm;
