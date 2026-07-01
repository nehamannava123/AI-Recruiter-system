import React from "react";
import { BriefcaseIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-gray-800 shadow">
        <h1 className="text-2xl font-bold">Recruiter Hub</h1>
        <span className="text-sm text-gray-400">noureenandteam</span>
      </nav>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <h2 className="text-4xl font-extrabold mb-12">Choose Evaluation Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-4/5 max-w-4xl">
          
          {/* Resume Evaluation */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-10 flex flex-col items-center hover:bg-gray-700 transition">
            <BriefcaseIcon className="h-16 w-16 text-indigo-400 mb-6" />
            <h3 className="text-2xl font-semibold mb-4">Resume Evaluation</h3>
            <p className="mb-6 text-center text-gray-300">
              AI-powered resume screening and scoring.
            </p>
            <a
              href="/frontend"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Open Resume Evaluation
            </a>
          </div>

          {/* Interview Evaluation */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-10 flex flex-col items-center hover:bg-gray-700 transition">
            <VideoCameraIcon className="h-16 w-16 text-pink-400 mb-6" />
            <h3 className="text-2xl font-semibold mb-4">Interview Evaluation</h3>
            <p className="mb-6 text-center text-gray-300">
              Face tracking, speech analysis, and reporting.
            </p>
            <a
              href="/recluta/frontend"
              className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Open Interview Evaluation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
