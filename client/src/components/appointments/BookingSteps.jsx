import { Check } from 'lucide-react';

const steps = [
  { number: 1, label: 'Select Date' },
  { number: 2, label: 'Select Slot' },
  { number: 3, label: 'Add Reason' },
  { number: 4, label: 'Confirm' },
];

export default function BookingSteps({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isDone = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm
                transition-all duration-300
                ${isDone
                  ? 'bg-primary-600 text-white'
                  : isActive
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                  : 'bg-gray-100 text-gray-400'
                }
              `}>
                {isDone ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span className={`mt-2 text-xs font-medium whitespace-nowrap ${
                isActive || isDone ? 'text-primary-700' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-2 mb-5 transition-colors duration-300 ${
                currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
