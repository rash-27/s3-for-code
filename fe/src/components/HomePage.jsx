import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black space-y-6">
      <h1 className="text-4xl font-bold text-white">S3 for CODE</h1>
      
      <button
        className="px-6 py-3 bg-white text-black rounded hover:bg-gray-300"
        onClick={() => navigate('/upload')}
      >
        Upload Function
      </button>
      
      <button
        className="px-6 py-3 bg-white text-black rounded hover:bg-gray-300"
        onClick={() => navigate('/functions')}
      >
        Show Functions List
      </button>
    </div>
  );
}
