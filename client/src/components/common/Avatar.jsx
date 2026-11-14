import { getInitials } from '../../utils/formatters.js';

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-xl',
  };

  const initials = getInitials(name);

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
          {initials}
        </div>
      )}
    </div>
  );
}
