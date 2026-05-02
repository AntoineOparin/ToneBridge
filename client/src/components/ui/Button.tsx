import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40',
  secondary:
    'bg-surface-800 text-white border border-surface-700 hover:border-surface-600 hover:bg-surface-700',
  ghost:
    'bg-transparent text-surface-300 hover:text-white hover:bg-surface-800/60',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      {...rest}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      disabled={disabled}
      className={`font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass[size]} ${variantClass[variant]} ${className}`}
    >
      {children}
    </motion.button>
  )
}
