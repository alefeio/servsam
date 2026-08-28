import type { Provenanced } from "@/types/provenance";

export type ServiceCategoryId = "water-sanitation" | "environmental-pest";

export type ServiceCategory = Provenanced<{
  id: ServiceCategoryId;
  slug: string;
  name: string;
  summary: string;
}>;

export type Service = Provenanced<{
  id: string;
  slug: string;
  name: string;
  categoryId: ServiceCategoryId;
  summary: string;
  description: string;
  imageHint: string;
  imageSrc?: string;
  imageAlt?: string;
}>;

export type Segment = Provenanced<{
  id: string;
  slug: string;
  name: string;
  summary: string;
  imageHint: string;
  imageSrc?: string;
  imageAlt?: string;
}>;

export type Certification = Provenanced<{
  id: string;
  name: string;
  statusLabel: string;
}>;

export type NavItem = {
  href: string;
  label: string;
};

export type CommercialProcessStep = Provenanced<{
  id: string;
  order: number;
  title: string;
  description: string;
}>;

export type Training = Provenanced<{
  id: string;
  name: string;
}>;

export type CompanyProfile = {
  brandName: string;
  fullBrandName: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  foundedOn: string;
  cadastralStatus: string;
  tagline: string;
  institutionalText: string;
  teamText: string;
  purpose: string;
};

export type ContactInfo = {
  businessHours: string;
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
  whatsappDisplay: string;
  whatsappE164: string;
  phoneDisplay: string;
  phoneE164: string;
  email: string;
  instagramUrl: string;
  instagramHandle: string;
};

export type WhyChooseItem = Provenanced<{
  id: string;
  title: string;
  description: string;
}>;

export type CaseStudy = Provenanced<{
  id: string;
  slug: string;
  title: string;
  clientAlias: string;
  segment: string;
  serviceFocus: string;
  summary: string;
  imageHint: string;
  imageSrc?: string;
  imageAlt?: string;
}>;

export type EditorialArticle = Provenanced<{
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageHint: string;
  imageSrc?: string;
  imageAlt?: string;
}>;
