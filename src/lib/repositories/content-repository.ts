import { certifications } from "@/data/official/certifications";
import { company, trainings, whyChooseItems } from "@/data/official/company";
import { contactInfo } from "@/data/official/contact";
import { homeContent, technicalDeliverables } from "@/data/official/home";
import { publicNavItems } from "@/data/official/navigation";
import { commercialProcessSteps } from "@/data/official/process";
import { segments } from "@/data/official/segments";
import { serviceCategories, services } from "@/data/official/services";
import { demoArticles } from "@/data/demo/articles";
import { demoCases } from "@/data/demo/cases";
import type {
  CaseStudy,
  Certification,
  CommercialProcessStep,
  CompanyProfile,
  ContactInfo,
  EditorialArticle,
  NavItem,
  Segment,
  Service,
  ServiceCategory,
  TechnicalDeliverable,
  Training,
  WhyChooseItem,
} from "@/types/content";

export type ContentRepository = {
  getCompany: () => CompanyProfile;
  getContact: () => ContactInfo;
  getTrainings: () => Training[];
  getWhyChooseItems: () => WhyChooseItem[];
  getServiceCategories: () => ServiceCategory[];
  getServices: () => Service[];
  getServiceBySlug: (slug: string) => Service | undefined;
  getServicesByCategory: (categoryId: Service["categoryId"]) => Service[];
  getSegments: () => Segment[];
  getCertifications: () => Certification[];
  getPublicNav: () => NavItem[];
  getProcessSteps: () => CommercialProcessStep[];
  getTechnicalDeliverables: () => TechnicalDeliverable[];
  getFeaturedServices: () => Service[];
  getDemoCases: () => CaseStudy[];
  getDemoArticles: () => EditorialArticle[];
};

export const contentRepository: ContentRepository = {
  getCompany: () => company,
  getContact: () => contactInfo,
  getTrainings: () => trainings,
  getWhyChooseItems: () => whyChooseItems,
  getServiceCategories: () => serviceCategories,
  getServices: () => services,
  getServiceBySlug: (slug) => services.find((service) => service.slug === slug),
  getServicesByCategory: (categoryId) =>
    services.filter((service) => service.categoryId === categoryId),
  getSegments: () => segments,
  getCertifications: () => certifications,
  getPublicNav: () => publicNavItems,
  getProcessSteps: () => commercialProcessSteps,
  getTechnicalDeliverables: () => technicalDeliverables,
  getFeaturedServices: () =>
    homeContent.featuredServiceIds.map((id) => {
      const service = services.find((item) => item.id === id);
      if (!service) {
        throw new Error(`Serviço em destaque ausente do catálogo oficial: ${id}`);
      }
      return service;
    }),
  getDemoCases: () => demoCases,
  getDemoArticles: () => demoArticles,
};
