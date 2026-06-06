import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <main className="flex flex-col items-center gap-6 md:gap-8 text-center px-4 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
          Talk to Strangers
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed">
          Connect with random people around the world via video and text.
          Simple, anonymous, and free.
        </p>

        <Link
          href="/chat"
          className="px-6 py-3 md:px-8 md:py-4 bg-black dark:bg-white text-white dark:text-black text-lg md:text-xl font-bold rounded-full hover:opacity-80 transition-opacity"
        >
          Start Chatting
        </Link>
      </main>

      <footer className="absolute bottom-6 md:bottom-8 text-zinc-500 text-xs md:text-sm">
        Minimalist Omegle Clone
      </footer>
    </div>
  );
}
