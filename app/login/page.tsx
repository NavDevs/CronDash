'use client';

import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-mono text-sm text-primary hover:text-secondary transition-colors">
            ~/crondash
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="font-mono text-sm text-primary">[ LOGIN ]</Link>
            <Link href="/signup" className="font-mono text-sm text-primary hover:text-primary transition-colors">
              [ SIGN UP ]
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="border border-border bg-background p-1">
            <div className="border-b border-border px-4 py-2 bg-muted/20">
              <span className="font-mono text-sm text-primary">+--- AUTHENTICATION ---+</span>
            </div>
            <div className="p-4">
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/signup"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent border-0 shadow-none w-full",
                    headerTitle: "font-mono text-primary text-sm",
                    headerSubtitle: "font-mono text-primary text-xs",
                    socialButtonsBlockButton: "font-mono text-sm border border-border bg-background text-primary hover:bg-muted/20 w-full",
                    socialButtonsBlockButtonText: "font-mono text-sm text-primary",
                    dividerLine: "bg-border",
                    dividerText: "font-mono text-xs text-primary",
                    formFieldLabel: "font-mono text-xs text-primary uppercase",
                    formFieldInput: "font-mono text-sm bg-background border border-border text-primary",
                    formButtonPrimary: "font-mono text-sm bg-primary text-background hover:bg-primary/90 w-full",
                    footerActionLink: "font-mono text-xs text-primary hover:text-secondary",
                    identityPreviewEditButton: "font-mono text-xs text-primary",
                  },
                }}
              />
            </div>
          </div>

          <div className="text-center font-mono text-xs text-primary">
            <span className="text-primary">[INFO]</span> ENTER YOUR CREDENTIALS TO ACCESS THE DASHBOARD
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between font-mono text-xs text-primary">
          <span>© 2026 CRONDASH</span>
          <span>TERMINAL ACCESS GRANTED</span>
        </div>
      </footer>
    </div>
  );
}
