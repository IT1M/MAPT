'use client';

/**
 * Animation Examples Component
 *
 * This file demonstrates how to use the animation system.
 * Use these examples as reference when implementing animations in your components.
 *
 * DO NOT import this file in production code - it's for reference only.
 */

import { useState } from 'react';
import {
  PageTransition,
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  StaggerChildren,
  useModalAnimation,
  useDropdownAnimation,
  useToastAnimation,
  useShakeAnimation,
  useBounceAnimation,
  useScrollAnimation,
  ANIMATION_CLASSES,
  ANIMATION_DURATION,
} from './animations';

// ============================================
// Example 1: Page Transition
// ============================================
export function PageTransitionExample() {
  return (
    <PageTransition>
      <div className="p-8">
        <h1>Page Content</h1>
        <p>This content fades in when the route changes.</p>
      </div>
    </PageTransition>
  );
}

// ============================================
// Example 2: Modal with Animation
// ============================================
export function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const { shouldRender, backdropClass, contentClass } =
    useModalAnimation(isOpen);

  if (!shouldRender) return null;

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${backdropClass}`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full ${contentClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">Modal Title</h2>
          <p className="mb-4">Modal content goes here.</p>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-primary-500 text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================
// Example 3: Dropdown with Animation
// ============================================
export function DropdownExample() {
  const [isOpen, setIsOpen] = useState(false);
  const { shouldRender, animationClass } = useDropdownAnimation(isOpen);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-primary-500 text-white rounded"
      >
        Toggle Dropdown
      </button>

      {shouldRender && (
        <div
          className={`absolute top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[200px] ${animationClass}`}
        >
          <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
            Option 1
          </button>
          <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
            Option 2
          </button>
          <button className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700">
            Option 3
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Example 4: Toast Notification
// ============================================
export function ToastExample() {
  const [isVisible, setIsVisible] = useState(false);
  const { shouldRender, animationClass } = useToastAnimation(isVisible);

  const showToast = () => {
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 3000);
  };

  return (
    <>
      <button
        onClick={showToast}
        className="px-4 py-2 bg-primary-500 text-white rounded"
      >
        Show Toast
      </button>

      {shouldRender && (
        <div
          className={`fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg ${animationClass}`}
        >
          Success! Your action was completed.
        </div>
      )}
    </>
  );
}

// ============================================
// Example 5: Fade Transition
// ============================================
export function FadeTransitionExample() {
  const [show, setShow] = useState(true);

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="px-4 py-2 bg-primary-500 text-white rounded mb-4"
      >
        Toggle Content
      </button>

      <FadeTransition show={show} duration={ANIMATION_DURATION.NORMAL}>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          This content fades in and out.
        </div>
      </FadeTransition>
    </div>
  );
}

// ============================================
// Example 6: Slide Transition
// ============================================
export function SlideTransitionExample() {
  const [show, setShow] = useState(true);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>(
    'down'
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShow(!show)}
          className="px-4 py-2 bg-primary-500 text-white rounded"
        >
          Toggle
        </button>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as any)}
          className="px-4 py-2 border rounded"
        >
          <option value="up">Up</option>
          <option value="down">Down</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>

      <SlideTransition
        show={show}
        direction={direction}
        duration={ANIMATION_DURATION.SLOW}
      >
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          This content slides in from {direction}.
        </div>
      </SlideTransition>
    </div>
  );
}

// ============================================
// Example 7: Scale Transition
// ============================================
export function ScaleTransitionExample() {
  const [show, setShow] = useState(true);

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="px-4 py-2 bg-primary-500 text-white rounded mb-4"
      >
        Toggle Content
      </button>

      <ScaleTransition
        show={show}
        origin="top"
        duration={ANIMATION_DURATION.NORMAL}
      >
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          This content scales in and out.
        </div>
      </ScaleTransition>
    </div>
  );
}

// ============================================
// Example 8: Stagger Children
// ============================================
export function StaggerChildrenExample() {
  const items = [
    { id: 1, title: 'Item 1', description: 'First item' },
    { id: 2, title: 'Item 2', description: 'Second item' },
    { id: 3, title: 'Item 3', description: 'Third item' },
    { id: 4, title: 'Item 4', description: 'Fourth item' },
    { id: 5, title: 'Item 5', description: 'Fifth item' },
  ];

  return (
    <StaggerChildren staggerDelay={50} className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <h3 className="font-bold">{item.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {item.description}
          </p>
        </div>
      ))}
    </StaggerChildren>
  );
}

// ============================================
// Example 9: Shake Animation (Error Feedback)
// ============================================
export function ShakeAnimationExample() {
  const { className, shake } = useShakeAnimation();

  return (
    <div className={className}>
      <button
        onClick={shake}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Trigger Error Shake
      </button>
    </div>
  );
}

// ============================================
// Example 10: Bounce Animation (Attention)
// ============================================
export function BounceAnimationExample() {
  const { className, bounce } = useBounceAnimation();

  return (
    <div className={className}>
      <button
        onClick={bounce}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Trigger Attention Bounce
      </button>
    </div>
  );
}

// ============================================
// Example 11: Scroll Animation (Sticky Header)
// ============================================
export function ScrollAnimationExample() {
  const hasScrolled = useScrollAnimation(100);

  return (
    <>
      <header
        className={`sticky top-0 bg-white dark:bg-gray-800 p-4 transition-shadow duration-200 ${
          hasScrolled ? 'shadow-lg' : ''
        }`}
      >
        <h1>Sticky Header</h1>
        <p className="text-sm text-gray-600">
          Scroll down to see shadow appear
        </p>
      </header>

      <div className="h-[200vh] p-8">
        <p>Scroll down to see the header shadow appear...</p>
      </div>
    </>
  );
}

// ============================================
// Example 12: Button with Press Animation
// ============================================
export function ButtonPressExample() {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <button
      onClick={handleClick}
      className={`px-6 py-3 bg-primary-500 text-white rounded-lg ${
        isPressed ? ANIMATION_CLASSES.BUTTON_PRESS : ''
      }`}
    >
      Click Me
    </button>
  );
}

// ============================================
// Example 13: Hover Lift Effect
// ============================================
export function HoverLiftExample() {
  return (
    <div
      className={`p-6 bg-white dark:bg-gray-800 rounded-lg ${ANIMATION_CLASSES.HOVER_LIFT}`}
    >
      <h3 className="font-bold mb-2">Hover over me</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        This card lifts up when you hover over it.
      </p>
    </div>
  );
}

// ============================================
// Example 14: Loading Skeleton
// ============================================
export function SkeletonExample() {
  return (
    <div className="space-y-4">
      <div
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${ANIMATION_CLASSES.SKELETON_PULSE}`}
      />
      <div
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 ${ANIMATION_CLASSES.SKELETON_PULSE}`}
      />
      <div
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 ${ANIMATION_CLASSES.SKELETON_PULSE}`}
      />
    </div>
  );
}

// ============================================
// Example 15: Spinner
// ============================================
export function SpinnerExample() {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full ${ANIMATION_CLASSES.SPIN}`}
      />
      <span>Loading...</span>
    </div>
  );
}

// ============================================
// Example 16: Badge Pulse
// ============================================
export function BadgePulseExample() {
  return (
    <div className="relative inline-block">
      <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded">
        Notifications
      </button>
      <span
        className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full ${ANIMATION_CLASSES.BADGE_PULSE}`}
      >
        3
      </span>
    </div>
  );
}

// ============================================
// Example 17: Bell Ring Animation
// ============================================
export function BellRingExample() {
  const [isRinging, setIsRinging] = useState(false);

  const ring = () => {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 500);
  };

  return (
    <button
      onClick={ring}
      className={`text-2xl ${isRinging ? ANIMATION_CLASSES.BELL_RING : ''}`}
    >
      🔔
    </button>
  );
}

// ============================================
// All Examples Demo Page
// ============================================
export function AnimationExamplesDemo() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold mb-8">Animation System Examples</h1>

      <section>
        <h2 className="text-2xl font-bold mb-4">1. Modal Animation</h2>
        <ModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">2. Dropdown Animation</h2>
        <DropdownExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">3. Toast Notification</h2>
        <ToastExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">4. Fade Transition</h2>
        <FadeTransitionExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">5. Slide Transition</h2>
        <SlideTransitionExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">6. Scale Transition</h2>
        <ScaleTransitionExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">7. Stagger Children</h2>
        <StaggerChildrenExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">8. Shake Animation</h2>
        <ShakeAnimationExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">9. Bounce Animation</h2>
        <BounceAnimationExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">10. Button Press</h2>
        <ButtonPressExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">11. Hover Lift</h2>
        <HoverLiftExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">12. Loading Skeleton</h2>
        <SkeletonExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">13. Spinner</h2>
        <SpinnerExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">14. Badge Pulse</h2>
        <BadgePulseExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">15. Bell Ring</h2>
        <BellRingExample />
      </section>
    </div>
  );
}
