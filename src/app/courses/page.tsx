import type { Metadata } from 'next';
import CoursesClient from '@/components/courses/CoursesClient';

export const metadata: Metadata = {
  title: "Technical Courses & Certifications | ConnectSeniors",
  description: "Access industry-standard technical resources and recognized certification paths. Meticulously vetted by seniors to align with professional engineering standards.",
  openGraph: {
    title: "Vetted Technical Curriculum",
    description: "Curated learning resources and certifications for modern software engineering.",
    type: 'website',
  }
};

export default function CoursesPage() {
  return <CoursesClient />;
}
