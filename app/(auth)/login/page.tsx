import { AuthForm } from "@/components/AuthForm";

export default function Page() {
  return (
    <div 
      className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/assets/bg.jpg)',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-sm">
        <AuthForm />
      </div>
      <div className="absolute bottom-4 right-4 z-10 text-xs text-white/60">
        <a 
          href="http://www.freepik.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-white/80 transition-colors"
        >
          Designed by Freepik
        </a>
      </div>
    </div>
  );
}
