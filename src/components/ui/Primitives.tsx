import React, { ReactNode } from 'react';

// -------------------------------------------------------------
// Card
// -------------------------------------------------------------
interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  hoverLift?: boolean;
  onClick?: () => void;
  ref?: React.Ref<HTMLDivElement>;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', elevated = false, hoverLift = false, onClick }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`rounded-card border transition-all duration-200 ${
          elevated ? 'bg-elevated' : 'bg-surface'
        } ${
          hoverLift
            ? 'hover:-translate-y-0.5 hover:shadow-lg hover:border-text/20 cursor-pointer'
            : ''
        } ${className}`}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// -------------------------------------------------------------
// Provider Badge
// -------------------------------------------------------------
interface ProviderBadgeProps {
  provider: 'AWS' | 'Azure' | 'GCP' | string;
  className?: string;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({ provider, className = '' }) => {
  const p = provider.toUpperCase();

  if (p === 'AWS') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/10 text-aws border border-amber-500/25 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-aws inline-block"></span>
        AWS
      </span>
    );
  }

  if (p === 'AZURE') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/10 text-azure border border-blue-500/25 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-azure inline-block"></span>
        Azure
      </span>
    );
  }

  if (p === 'GCP') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/10 text-gcp border border-emerald-500/25 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-gcp inline-block"></span>
        GCP
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/10 text-muted border border-border ${className}`}
    >
      {provider}
    </span>
  );
};

// -------------------------------------------------------------
// Priority Pill
// -------------------------------------------------------------
interface PriorityBadgeProps {
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const pr = priority.toUpperCase();
  if (pr === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-danger/15 text-danger border border-danger/30 ${className}`}
      >
        HIGH
      </span>
    );
  }
  if (pr === 'MEDIUM') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-warning/15 text-warning border border-warning/30 ${className}`}
      >
        MEDIUM
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-muted/15 text-muted border border-border ${className}`}
    >
      LOW
    </span>
  );
};

// -------------------------------------------------------------
// Status Pill
// -------------------------------------------------------------
interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'attached' | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const s = status.toLowerCase();
  if (s === 'running') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success border border-success/20 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
        Running
      </span>
    );
  }
  if (s === 'stopped') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/15 text-muted border border-border ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-muted"></span>
        Stopped
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-info/10 text-info border border-info/20 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-info"></span>
      {status}
    </span>
  );
};

// -------------------------------------------------------------
// Button
// -------------------------------------------------------------
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-xs font-semibold gap-2',
    lg: 'px-4 py-2.5 text-sm font-semibold gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-brand-indigo to-brand-cyan text-slate-950 font-bold hover:opacity-95 shadow-md shadow-brand-indigo/20 active:scale-[0.98]',
    secondary:
      'bg-elevated hover:bg-border/60 text-text border border-border active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-surface text-text border border-border hover:border-text/30 active:scale-[0.98]',
    danger:
      'bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-surface text-muted hover:text-text active:scale-[0.98]',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-btn transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-3.5 w-3.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

// -------------------------------------------------------------
// Skeleton Shimmer
// -------------------------------------------------------------
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-border/40 rounded shimmer ${className}`}
      aria-hidden="true"
    />
  );
};

// -------------------------------------------------------------
// Segmented Control
// -------------------------------------------------------------
interface SegmentedControlOption<T> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'sm',
}: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex items-center p-1 rounded-btn bg-elevated border border-border">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-1.5 rounded-btn transition-all duration-150 ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
            } ${
              isSelected
                ? 'bg-surface text-text font-semibold shadow-sm border border-border'
                : 'text-muted hover:text-text'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
