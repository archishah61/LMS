import React from 'react';

export const Button = ({ children, className, onClick }) => (
  <button
    className={`${className} relative overflow-hidden group/btn`}
    onClick={onClick}
  >
    <span className="relative z-10">{children}</span>
    <div className="absolute inset-0 bg-indigo-700 transform translate-y-full transition-transform duration-300 ease-out group-hover/btn:translate-y-0" />
  </button>
);

export default Button;