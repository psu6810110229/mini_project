import React from 'react';

const Equipments = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Available Equipments</h1>
        <span className="text-sm text-gray-500">Showing all items</span>
      </div>
      
      {/* Placeholder Content */}
      <div className="bg-white rounded-lg shadow p-8 text-center border border-dashed border-gray-300">
        <p className="text-xl text-gray-600">🛠️ Shelf is empty (Waiting for API integration)</p>
        <p className="text-sm text-gray-400 mt-2">We will implement the list here in the next step.</p>
      </div>
    </div>
  );
};

export default Equipments;