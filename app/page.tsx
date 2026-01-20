import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <h1 className="text-6xl font-bold tracking-tighter">
          Talk to Strangers
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-md">
          Connect with random people around the world via video and text. 
          Simple, anonymous, and free.
        </p>
        
        <Link 
          href="/chat"
          className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black text-xl font-bold rounded-full hover:opacity-80 transition-opacity"
        >
          Start Chatting
        </Link>
      </main>
      
      <footer className="absolute bottom-8 text-gray-500 text-sm">
        Minimalist Omegle Clone
      </footer>
    </div>
  );
}
