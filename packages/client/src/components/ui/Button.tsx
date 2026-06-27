import { type ButtonHTMLAttributes } from 'react'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: string
  iconRight?: string
  full?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-white text-black hover:bg-[#e8e8e8] active:bg-[#d8d8d8]',
  secondary: 'bg-transparent text-body border border-transparent hover:bg-surface-elevated hover:border-hairline',
  tertiary: 'bg-surface-elevated text-body hover:bg-surface-card',
  outline: 'bg-transparent text-body border border-hairline hover:border-hairline-strong',
  danger: 'bg-accent-red-soft text-accent-red hover:bg-accent-red/20',
  ghost: 'bg-transparent text-mute hover:text-body',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-[30px] px-3 text-[13px]',
  md: 'h-9 px-4 text-[14px]',
  lg: 'h-11 px-5 text-[15px]',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  full,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors active:translate-y-[0.5px]',
        variantClasses[variant],
        sizeClasses[size],
        full && 'w-full',
        props.disabled && 'opacity-40 pointer-events-none',
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  )
}
