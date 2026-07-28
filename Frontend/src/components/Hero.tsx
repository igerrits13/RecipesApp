interface HeroProps {
  backgroundImage?: string;
  children: React.ReactNode;
}

// Hero component that accepts children as props
export default function Hero({ backgroundImage, children }: HeroProps) {
  return (
    <div className="relative flex h-full w-full rounded-4xl overflow-hidden max-h-[60vh]">
      <img
        className="w-full object-cover inset-0"
        src={backgroundImage}
        alt="Hero Image"
      />
      {children}
    </div>
  );
}
