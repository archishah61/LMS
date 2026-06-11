/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react';



export const StatusBadge = ({ status, type }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
      case 'failed':
      case 'not_started':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayText = () => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()}`}>
      {getDisplayText()}
    </span>
  );
};