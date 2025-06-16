export default function Button({ children, onClick, type = 'button', disabled }: { children: React.ReactNode, onClick?: () => void, type?: 'submit' | 'reset' | 'button', disabled?: boolean }) {
  return (
    <button 
      type={type} 
      className={`text-white bg-blue-500 p-2 rounded-md ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}