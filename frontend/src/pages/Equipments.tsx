import React from 'react';

const Equipments = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Available Equipments</h1>
          <span className="text-sm text-gray-600">Showing all items</span>
        </div>
        
        {/* Placeholder Content */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8 text-center border border-gray-300/40">
          <p className="text-xl text-gray-700">🛠️ Shelf is empty (Waiting for API integration)</p>
          <p className="text-sm text-gray-500 mt-2">We will implement the list here in the next step.</p>
        </div>
      </div>
    </div>
  );
};

export default Equipments;