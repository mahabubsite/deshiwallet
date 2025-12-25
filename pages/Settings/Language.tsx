
import React, { useState } from 'react';
import * as Router from 'react-router-dom';

const { useNavigate } = Router as any;

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'Global Standard' },
  { code: 'bn', name: 'Bengali', native: 'বাংলাদেশি মান' },
  { code: 'hi', name: 'Hindi', native: 'भारतीय मानक' },
  { code: 'ar', name: 'Arabic', native: 'المعيار العربي' }
];

const LanguageSelection: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('en');

  return (
    <div className="max-w-[700px] mx-auto p-4 md:py-20">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-secondary flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800 transition-all">
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tight">Localization</h1>
      </div>

      <div className="bg-white dark:bg-secondary border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
        {LANGUAGES.map((lang) => (
          <button 
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`w-full flex items-center justify-between p-8 group transition-all ${selected === lang.code ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-dark/10'}`}
          >
            <div className="flex flex-col text-left">
              <span className={`font-black text-lg uppercase tracking-tight ${selected === lang.code ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>{lang.name}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{lang.native}</span>
            </div>
            <div className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${selected === lang.code ? 'border-primary bg-primary text-white' : 'border-gray-200 group-hover:border-primary'}`}>
              {selected === lang.code && <i className="fas fa-check text-[10px]"></i>}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-gray-50 dark:bg-dark/50 border border-gray-100 dark:border-gray-800 text-center">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-loose">
          Note: System-wide localization update will take effect across all encrypted vault entries and platform notifications.
        </p>
      </div>
    </div>
  );
};

export default LanguageSelection;
