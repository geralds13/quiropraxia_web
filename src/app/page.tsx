import AboutSection from "@/components/AboutSection";
import AppointmentCTA from "@/components/AppointmentCTA";
import { BookingProvider } from "@/components/BookingProvider";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import OperatingHoursSection from "@/components/OperatingHoursSection";
import PackagesList from "@/components/PackagesList";
import ServicesList from "@/components/ServicesList";

export default function Home() {
  return (
    <BookingProvider>
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <AboutSection />
          <ServicesList />
          <PackagesList />
          <OperatingHoursSection />
          <AppointmentCTA />
        </main>
        <Footer />
      </div>
    </BookingProvider>
  );
}
