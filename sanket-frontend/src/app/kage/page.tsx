'use client';

import { KageLandingPage } from '@/shaders/landing-pages/LandingPages';

export default function KageRoute() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#05070a]">
      <KageLandingPage style={{ width: '100vw', height: '100vh' }} />
    </main>
  );
}
