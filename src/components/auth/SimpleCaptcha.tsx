'use client';

import { useState, useEffect } from 'react';

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
  className?: string;
}

/**
 * Simple math-based CAPTCHA component
 * For production, consider using reCAPTCHA or hCaptcha
 */
export function SimpleCaptcha({
  onVerify,
  className = '',
}: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');

  // Generate new challenge
  const generateChallenge = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
    setError('');
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const correctAnswer = num1 + num2;
    const answer = parseInt(userAnswer, 10);

    if (isNaN(answer)) {
      setError('Please enter a valid number');
      onVerify(false);
      return;
    }

    if (answer === correctAnswer) {
      setError('');
      onVerify(true);
    } else {
      setError('Incorrect answer. Please try again.');
      onVerify(false);
      generateChallenge();
    }
  };

  return (
    <div
      className={`border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${className}`}
    >
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Security Check
        </label>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <span className="bg-white dark:bg-gray-700 px-3 py-2 rounded border border-gray-300 dark:border-gray-600">
              {num1}
            </span>
            <span>+</span>
            <span className="bg-white dark:bg-gray-700 px-3 py-2 rounded border border-gray-300 dark:border-gray-600">
              {num2}
            </span>
            <span>=</span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="?"
            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
            aria-label="Enter the sum"
            aria-describedby={error ? 'captcha-error' : undefined}
          />
        </div>
        {error && (
          <p
            id="captcha-error"
            className="text-sm text-red-600 dark:text-red-400 mb-2"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-sm font-medium"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={generateChallenge}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium"
          >
            New Challenge
          </button>
        </div>
      </form>
    </div>
  );
}
