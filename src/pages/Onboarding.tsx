import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAppStore, createDemoAgents } from '@/store/app-store';
import { Shield, Sparkles, Zap, ChevronRight, Rocket } from 'lucide-react';

const slides = [
  {
    icon: Sparkles,
    title: 'Your Personal AI Agents',
    description: 'Create smart assistants for micro-tasks like summarizing, drafting emails, and quick research.',
    color: 'bg-gradient-hero',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays on your device. No tracking, no unnecessary permissions, just helpful AI.',
    color: 'bg-gradient-warm',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Run agents with one tap. Get exactly what you need in seconds, not minutes.',
    color: 'bg-gradient-hero',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const setHasCompletedOnboarding = useAppStore((s) => s.setHasCompletedOnboarding);
  
  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    createDemoAgents();
    navigate('/');
  };
  
  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    createDemoAgents();
    navigate('/');
  };
  
  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };
  
  const slide = slides[currentSlide];
  const Icon = slide.icon;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip button */}
      <div className="p-4 flex justify-end safe-area-top">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`w-24 h-24 rounded-3xl ${slide.color} flex items-center justify-center mx-auto mb-8 shadow-lg`}
            >
              <Icon className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            
            {/* Text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-foreground mb-4"
            >
              {slide.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-sm mx-auto"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Bottom section */}
      <div className="p-8 pb-12 safe-area-bottom">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-muted'
              }`}
              layoutId={`dot-${index}`}
            />
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="space-y-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={nextSlide}
              className="w-full h-14 text-lg bg-gradient-hero text-primary-foreground hover:opacity-90"
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
          
          {currentSlide === slides.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="ghost"
                onClick={() => navigate('/templates')}
                className="w-full text-muted-foreground"
              >
                Explore Templates First
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
