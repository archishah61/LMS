/* eslint-disable react/prop-types */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React from 'react';

const PrimaryLoader = ({ className = "h-12 w-12" }) => {
  return (
    <div className="flex justify-center items-center py-8">
      <div 
        className={`animate-spin rounded-full border-t-2 border-b-2 border-primary border-t-forestGreen ${className}`}
      ></div>
    </div>
  );
};

export default PrimaryLoader;
