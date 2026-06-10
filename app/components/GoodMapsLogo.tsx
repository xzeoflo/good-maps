interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export default function GoodMapsLogo({ size = "md" }: LogoProps) {
  const sizes = {
    sm: { icon: 32, title: "text-xl", subtitle: "text-xs" },
    md: { icon: 48, title: "text-3xl", subtitle: "text-sm" },
    lg: { icon: 64, title: "text-4xl", subtitle: "text-base" },
  };
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Pin icon */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer pin shape */}
        <path
          d="M24 4C16.268 4 10 10.268 10 18C10 28 24 44 24 44C24 44 38 28 38 18C38 10.268 31.732 4 24 4Z"
          fill="#1a1a1a"
        />
        {/* Inner white circle */}
        <circle cx="24" cy="18" r="7" fill="white" />
        {/* Red dot in center */}
        <circle cx="24" cy="18" r="3.5" fill="#E8554A" />
        {/* Letter R shape */}
        <path
          d="M21 14.5H25.5C26.88 14.5 28 15.62 28 17C28 18.38 26.88 19.5 25.5 19.5H21V14.5Z"
          fill="white"
          opacity="0"
        />
      </svg>

      {/* Title */}
      <div className={`font-black tracking-wider ${s.title} leading-none`}>
        <span className="text-[#E8554A]">GOOD</span>
        <span className="text-[#1a1a1a]"> MAPS</span>
      </div>

      {/* Subtitle */}
      <p
        className={`${s.subtitle} tracking-widest text-[#1a1a1a] uppercase font-medium`}
      >
        Suggestions d&apos;activités adaptées
      </p>
    </div>
  );
}
