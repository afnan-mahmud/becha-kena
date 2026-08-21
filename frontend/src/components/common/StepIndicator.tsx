import { Check } from 'lucide-react';
import './StepIndicator.css';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
            <div className="step-circle">
              {isCompleted ? <Check size={16} strokeWidth={3} /> : index + 1}
            </div>
            <div className="step-label">{step}</div>
            
            {/* Don't show connecting line for the last item */}
            {index < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
};
