interface BootHopLogoProps {
  className?: string;
  textClass?: string;
  iconClass?: string;
}

export default function BootHopLogo({ className = '', textClass = '', iconClass = '' }: BootHopLogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      {/* Person carrying a package silhouette */}
      <svg
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        className={`h-8 w-8 flex-shrink-0 ${iconClass}`}
        aria-hidden="true"
      >
        {/* Head */}
        <circle cx="11" cy="5.5" r="4" fill="currentColor" />

        {/* Torso (slightly forward-leaning) */}
        <path
          d="M8 10 C7 11 6.5 14 7 18 L10 18 L11 13 L12 18 L15 18 C15.5 14 15 11 14 10 Z"
          fill="currentColor"
        />

        {/* Left arm swinging forward */}
        <path d="M8 11.5 L4.5 16.5 L6.5 17.5 L10 12.5 Z" fill="currentColor" />

        {/* Right arm holding package */}
        <path d="M14 11.5 L17 14 L15.5 15 L13 12.5 Z" fill="currentColor" />

        {/* Left leg (forward step) */}
        <path d="M8.5 18 L6.5 29 L9.5 29 L11 20 Z" fill="currentColor" />

        {/* Right leg (back step) */}
        <path d="M12 18 L14 29 L17 29 L14 20 Z" fill="currentColor" />

        {/* Package / box being carried on back */}
        <rect x="15" y="9" width="10" height="10" rx="2" fill="currentColor" />

        {/* Package strap detail */}
        <path d="M15 12 L14 12" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" />
        <path d="M15 16 L14 16" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" />
      </svg>

      <span className={`text-xl font-black tracking-tight ${textClass}`}>
        Boot<span className="text-blue-500">Hop</span>
      </span>
    </span>
  );
}
