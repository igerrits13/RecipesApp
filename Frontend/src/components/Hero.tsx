interface HeroProps {
  backgroundImage?: string;
  children: React.ReactNode;
}

// Hero component that accepts children as props
export default function Hero({ backgroundImage, children }: HeroProps) {
  return (
    <div className="relative flex flex-1 items-center justify-center w-full py-8 rounded-4xl overflow-hidden min-h-100 max-h-[60vh] landscape:max-h-none">
      <img
        className="absolute inset-0 h-full w-full object-cover"
        src={backgroundImage}
        alt="Hero Image"
      />
      {children}
    </div>
  );
}
