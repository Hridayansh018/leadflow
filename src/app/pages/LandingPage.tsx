import React from 'react';
import { Phone, Users, BarChart3, Zap, Shield, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--background)] via-[var(--card)] to-[var(--accent)] text-[var(--foreground)] font-sans">
      <header className="w-full max-w-3xl mx-auto text-center py-16">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: 'Chirp, Inter, system-ui, sans-serif' }}>
          Welcome to <span className="text-[var(--primary)]">LeadFlow</span>
        </h1>
        <p className="text-xl text-[var(--secondary)] mb-8">The next-gen CRM for real estate pros, inspired by the best of social and productivity apps.</p>
        <Button onClick={() => onNavigate('login')} size="lg" className="bg-[var(--primary)] text-[var(--primary-foreground)] px-8 py-4 text-lg font-bold shadow-lg hover:bg-[var(--accent)] transition-all duration-200">
          Go to Dashboard
        </Button>
      </header>
      <main className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Social-Driven UI</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Modern, familiar, and lightning-fast. Feels like your favorite social app, but built for business.</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[var(--accent2)] to-[var(--primary)] text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Multi-Channel Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Run, track, and optimize campaigns across calls, emails, and more—all in one place.</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[var(--accent3)] to-[var(--primary)] text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Analytics & Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Get actionable insights with beautiful charts and real-time stats, styled for clarity and impact.</p>
          </CardContent>
        </Card>
      </main>
      <footer className="w-full text-center py-8 text-[var(--muted-foreground)]">
        &copy; {new Date().getFullYear()} LeadFlow. All rights reserved.
      </footer>
    </div>
  );
}