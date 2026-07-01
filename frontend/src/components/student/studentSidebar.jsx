/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
// import { button } from '@/components/ui/button';

export default function StudentSidebar({ isOpen, toggleSidebar }) {
  return (
    <div className="flex">
      {/* Sidebar button */}
      <button
        onClick={toggleSidebar}
        className={`m-2 transition-transform duration-300 z-50 fixed`}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white shadow-lg transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <nav className="p-4">
          <h2 className="text-xl font-bold mb-4">Student Sidebar</h2>
          <ul>
            <li className="py-2 px-4 hover:bg-gray-700 cursor-pointer">
              <NavLink to="/student-dashboard" className="block w-full">Dashboard</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
