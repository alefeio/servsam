import { certifications } from "@/data/official/certifications";
import { company, trainings, whyChooseItems } from "@/data/official/company";
import { contactInfo } from "@/data/official/contact";
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
  getDemoCases: () => demoCases,
  getDemoArticles: () => demoArticles,
};
