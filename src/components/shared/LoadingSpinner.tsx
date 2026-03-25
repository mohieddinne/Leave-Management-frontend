interface Props { size?: 'sm' | 'md' | 'lg'; className?: string }
export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-blue-200 border-t-blue-600`} />
    </div>
  )
}
