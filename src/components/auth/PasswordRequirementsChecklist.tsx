'use client';

import { Check, X } from 'lucide-react';

interface PasswordRequirementsChecklistProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'At least one uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'At least one lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'At least one number',
    test: (password) => /\d/.test(password),
  },
  {
    label: 'At least one special character',
    test: (password) => /[^a-zA-Z0-9]/.test(password),
  },
];

export function PasswordRequirementsChecklist({
  password,
}: PasswordRequirementsChecklistProps) {
  if (!password) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Password Requirements:
      </p>
      <ul className="space-y-1.5">
        {requirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <li key={index} className="flex items-center gap-2 text-xs">
              <div
                className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                  isMet
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                }`}
              >
                {isMet ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </div>
              <span
                className={
                  isMet
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400'
                }
              >
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
