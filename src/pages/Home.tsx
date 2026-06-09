import React from 'react';

const Home: React.FC = () => (
  <div className="flex flex-col justify-center items-center h-[calc(100vh-120px)] bg-gradient-to-br from-cyan-50 to-blue-100 rounded-3xl border border-cyan-100 p-8 shadow-sm">
    <h1 className="text-4xl font-extrabold text-cyan-900 tracking-tight mb-2">Welcome to the Dashboard</h1>
    <p className="text-gray-500 text-sm">Manage car category and configuration parameters from settings.</p>
  </div>
);

export default Home;
