import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  label: string;
  emails: string[];
  onEmailsChange: (emails: string[]) => void;
  placeholder?: string;
}

export const EmailInput = ({ label, emails, onEmailsChange, placeholder }: EmailInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    if (isValidEmail(trimmedEmail)) {
      if (!emails.includes(trimmedEmail)) {
        onEmailsChange([...emails, trimmedEmail]);
      }
      setInputValue('');
      setError(null);
    } else {
      setError(`'${trimmedEmail}' não é um email válido.`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', 'Tab', ','].includes(e.key)) {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      onEmailsChange(emails.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      addEmail(inputValue);
    }
  };

  const removeEmail = (index: number) => {
    onEmailsChange(emails.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-text-secondary">{label}</label>
      <div 
        className={cn(
          "flex flex-wrap gap-2 p-2 bg-surface-50 rounded-xl border border-transparent focus-within:ring-2 focus-within:ring-gold-200 dark:focus-within:ring-gold-800 transition-all min-h-[50px]",
          error ? "border-red-300 focus-within:border-red-300 focus-within:ring-red-200" : ""
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email, index) => (
          <div 
            key={index} 
            className="flex items-center gap-1 bg-white dark:bg-surface-200 px-2 py-1 rounded-full border border-surface-200 dark:border-surface-300 shadow-sm"
          >
            <span className="text-xs font-medium text-text-primary">{email}</span>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); removeEmail(index); }}
              className="text-text-secondary hover:text-red-500 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary min-w-[120px] placeholder:text-text-secondary/50"
          placeholder={emails.length === 0 ? placeholder : ""}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
