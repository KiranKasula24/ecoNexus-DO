import Link from "next/link";
import Image from "next/image";


export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Enhanced glassmorphic card with stronger backdrop */}
          <div className="inline-block backdrop-blur-md bg-white/15 rounded-3xl p-12 border border-white/30 shadow-2xl">
            
            {/* Logo */}
  <       div className="flex justify-center mb-8">
          <Image
              src="/logo.png"
              alt="EcoNexus Logo"
              width={220}
              height={80}
              priority
              className="h-auto rounded-xl opacity-95 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)] transition-transform duration-500 hover:scale-105"


          />
        </div>

            <h1 className="text-5xl font-extrabold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] sm:text-6xl md:text-7xl">
              <span className="block">Welcome to</span>
              <span className="block text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.8)] font-black">
                EcoNexus
              </span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              AI-powered multi-agent platform for circular manufacturing. Turn
              your waste streams into revenue streams.
            </p>
            <div className="mt-10 flex justify-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-500/50 transition-all md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 border-2 border-white/40 text-base font-medium rounded-md text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm shadow-lg transition-all md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}