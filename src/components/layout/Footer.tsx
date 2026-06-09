import React from 'react';

export const Footer: React.FC = () => (
  <footer className="h-12 flex items-center justify-center bg-white/60 backdrop-blur-md border-t border-gray-200 text-sm text-gray-500 sticky bottom-0 w-full z-30">
    © {new Date().getFullYear()} Trippy Admin. All rights reserved.
  </footer>
);
