import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TechStack } from './components/TechStack';
import { IntroShowcase } from './components/IntroShowcase';
import { OurWorks } from './components/OurWorks';
import { Services } from './components/Services';
import { Pricing } from './components/Pricing';
import { OurApproach } from './components/OurApproach';
import { Testimonials } from './components/Testimonials';
import { Faqs } from './components/Faqs';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';
import { ContactModal } from './components/ContactModal';
import { ScheduleModal } from './components/ScheduleModal';
import { ProjectModal } from './components/ProjectModal';
import { PROJECTS, Project } from './data/siteData';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  const handleSelectProjectBySlug = (slug: string) => {
    const proj = PROJECTS.find((p) => p.slug === slug);
    if (proj) {
      setSelectedProject(proj);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#030303] text-[#efefef]' : 'bg-[#fafafa] text-[#111111]'}`}>
      {/* Header Bar */}
      <Header
        onOpenContact={() => setIsContactOpen(true)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />

      <main>
        {/* Hero Section with Interactive Studio Inspector Canvas */}
        <Hero
          onOpenContact={() => setIsContactOpen(true)}
          onOpenSchedule={() => setIsScheduleOpen(true)}
          onSelectProject={handleSelectProjectBySlug}
        />

        {/* Tools and platforms ticker marquee */}
        <TechStack />

        {/* Studio Ethos & Intro Showcase */}
        <IntroShowcase />

        {/* Featured Projects / Works */}
        <OurWorks
          onSelectProject={(proj) => setSelectedProject(proj)}
          onOpenContact={() => setIsContactOpen(true)}
        />

        {/* Capabilities & Platform Ecosystem */}
        <Services onOpenContact={() => setIsContactOpen(true)} />

        {/* Transparent Pricing with USD/INR Switch */}
        <Pricing onOpenContact={() => setIsContactOpen(true)} />

        {/* Six-Phase Approach */}
        <OurApproach />

        {/* Testimonials */}
        <Testimonials />

        {/* Frequently Asked Questions */}
        <Faqs />

        {/* Final Call to Action */}
        <CallToAction
          onOpenContact={() => setIsContactOpen(true)}
          onOpenSchedule={() => setIsScheduleOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer onOpenContact={() => setIsContactOpen(true)} />

      {/* Interactive Modals */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onOpenContact={() => setIsContactOpen(true)}
      />
    </div>
  );
}
