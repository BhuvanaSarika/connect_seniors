import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: "ConnectSeniors — High-Fidelity Engineering Mentorship",
  description: "Accelerate your transition from junior developer to industry engineer. Direct access to senior mentorship, architectural roadmaps, and verified technical assets.",
  openGraph: {
    title: "ConnectSeniors | Professional Engineering Ecosystem",
    description: "Bridging the gap between academic theory and industry excellence through senior-led guidance.",
    images: ['/logo.png'], // Reference the logo for social sharing
  }
};

export default function HomePage() {
  return <HomeClient />;
}
