/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';
import { Power } from "lucide-react";

const EndSessionModal = ({ isOpen, onCancel, onConfirm, sessionTimeSpent, formatTime }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-3 xs:p-4 sm:p-4 md:p-6">
            <div className="bg-white rounded-lg xs:rounded-xl sm:rounded-xl max-w-xs xs:max-w-sm sm:max-w-md w-full p-4 xs:p-5 sm:p-6 transform transition-all mx-2 xs:mx-3">
                <div className="text-center space-y-3 xs:space-y-4 sm:space-y-4">
                    <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <Power className="h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 text-red-500" />
                    </div>

                    {/* Title - Responsive text size */}
                    <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-800 px-2 xs:px-0">
                        End Current Session?
                    </h3>

                    {/* Description - Responsive text size and line height */}
                    <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed xs:leading-normal px-1 xs:px-0">
                        Are you sure you want to end your current learning session? Your progress will be saved.
                    </p>

                    {/* Session Duration - Responsive sizing */}
                    <div className="bg-gray-50 rounded-lg p-2 xs:p-3 sm:p-3">
                        <div className="text-xs xs:text-sm sm:text-sm text-gray-600 mb-0.5 xs:mb-1">Session Duration</div>
                        <div className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-800">
                            {formatTime(sessionTimeSpent)}
                        </div>
                    </div>

                    {/* Buttons - Responsive sizing and layout */}
                    <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-3 pt-2 xs:pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 xs:py-2 sm:py-2 text-gray-600 bg-gray-100 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 xs:py-2 sm:py-2 bg-red-500 text-white rounded-lg font-medium"
                        >
                            End Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EndSessionModal;