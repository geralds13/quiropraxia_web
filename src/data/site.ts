import type { WellnessContact } from "@/types/wellness";

export const CONTACT: WellnessContact = {
  phone: "51993709472",
  phoneDisplay: "+51 993 709 472",
  whatsapp: "51993709472",
  email: "contacto@quiropraxiabienestar.pe",
  address: "Jr. Principios de Bienestar 123, Tarapoto - San Martín",
  hours: [
    { days: "Lunes a Viernes", time: "8:00 a.m. – 8:00 p.m." },
    { days: "Sábados", time: "9:00 a.m. – 2:00 p.m." },
    { days: "Domingos", time: "Cerrado" },
  ],
};

export const BRAND = {
  name: "Quiropraxia Bienestar",
  tagline: "Cuerpo alineado, vida en equilibrio",
};

export const SPECIALTIES = [
  "Ajuste quiropráctico",
  "Masaje terapéutico",
  "Descompresión espinal",
  "Rehabilitación postural",
];

export const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Paquetes", href: "#paquetes" },
  { label: "Horarios", href: "#horarios" },
  { label: "Nosotros", href: "#nosotros" },
];