import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ContentSummary = ({ summaryData, onBack }) => {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'bullets', label: 'Key Points' },
    { id: 'flashcards', label: 'Flashcards' }
  ];

  const [flippedCards, setFlippedCards] = useState({});

  const toggleCard = (index) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gray-50 p-4 md:p-6"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 md:mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-300 text-sm md:text-base"
      >
        <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Content
      </button>

      <div className="max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-2 md:space-x-4 mb-4 md:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 whitespace-nowrap text-sm md:text-base ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-8">
          <AnimatePresence mode="sync">
            {activeTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="prose prose-sm md:prose-base max-w-none"
              >
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Summary</h2>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">{summaryData.summary}</p>
              </motion.div>
            )}

            {activeTab === 'bullets' && (
              <motion.div
                key="bullets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Key Points</h2>
                <ul className="space-y-2 md:space-y-3">
                  {summaryData.bullet_points.map((point, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start text-sm md:text-base"
                    >
                      <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
                      <span className="text-gray-600">{point.replace(/\*/g, '').trim()}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {activeTab === 'flashcards' && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
              >
                {summaryData.flash_cards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative h-40 md:h-48 [perspective:1000px]"
                    onClick={() => toggleCard(index)}
                  >
                    <div
                      className={`w-full h-full transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer ${flippedCards[index] ? '[transform:rotateY(180deg)]' : ''
                        }`}
                    >
                      {/* Front of card */}
                      <div className="absolute w-full h-full bg-white rounded-xl shadow-lg p-4 md:p-6 [backface-visibility:hidden] flex flex-col">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Question</h3>
                        <div className="text-gray-600 flex-1 overflow-y-auto scrollbar-hide text-sm md:text-base pb-8 md:pb-10">
                          {card.question.replace('**', '').trim()}
                        </div>
                        <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 text-blue-600 text-xs md:text-sm">
                          Click to flip
                        </div>
                      </div>
                      {/* Back of card */}
                      <div className="absolute w-full h-full bg-blue-50 rounded-xl shadow-lg p-4 md:p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">Answer</h3>
                        <div className="text-gray-600 flex-1 overflow-y-auto scrollbar-hide text-sm md:text-base pb-8 md:pb-10">
                          {card.answer.replace('**', '').trim()}
                        </div>
                        <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 text-blue-600 text-xs md:text-sm">
                          Click to flip back
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            <style>{`
           .scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
          `}</style>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
export default ContentSummary; 