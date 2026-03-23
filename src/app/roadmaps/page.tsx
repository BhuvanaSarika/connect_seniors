import type { Metadata } from 'next';
import RoadmapsClient from '@/components/roadmaps/RoadmapsClient';

export const metadata: Metadata = {
  title: "Professional Learning Roadmaps | ConnectSeniors",
  description: "Explore architectural learning paths curated by industry seniors. Master full-stack development, cloud architecture, and more through node-based structured navigation.",
  openGraph: {
    title: "Learning Roadmaps by ConnectSeniors",
    description: "Architectural learning paths meticulously crafted for engineering career acceleration.",
    type: 'website',
  }
};

export default function RoadmapsPage() {
  return <RoadmapsClient />;
}
