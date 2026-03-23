import type { Metadata } from 'next';
import ProjectsClient from '@/components/projects/ProjectsClient';

export const metadata: Metadata = {
  title: "Engineering Project Blueprints | ConnectSeniors",
  description: "Architecturally-curated repository of project challenges. Structured by complexity to bridge the gap between academic theory and industry engineering standards.",
  openGraph: {
    title: "Project Blueprints for Engineers",
    description: "Master full-stack, distributed systems, and mobile engineering through curated blueprints.",
    type: 'website',
  }
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
