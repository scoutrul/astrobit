import React, { useState } from 'react';
import { ProjectModal } from '../components/ProjectModal';

interface SharedContainerProps {
  className?: string;
}

export const SharedContainer: React.FC<SharedContainerProps> = ({ className = '' }) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  return (
    <div className={className}>
      {/* Project Info Link - Fixed in bottom right corner */}
      <button
        onClick={() => setIsProjectModalOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all duration-200 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-orange-400">ℹ️</span>
          <span className="hidden sm:inline">О проекте</span>
        </div>
      </button>

      {/* Project Modal */}
      <ProjectModal 
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </div>
  );
}; 