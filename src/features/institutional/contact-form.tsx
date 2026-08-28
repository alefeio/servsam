"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactFormSchema, type ContactFormValues } from "@/lib/content/schemas";
import { contentRepository } from "@/lib/repositories/content-repository";
import { buildWhatsAppUrl } from "@/lib/utils/format";

const emptyValues: ContactFormValues = {
  name: "",
  company: "",
  phone: "",
  email: "",
  serviceType: "",
  city: "",
  message: "",
  consent: true,
};

type FieldErrors = Partial<Record<keyof ContactFormValues, string>>;

export function ContactForm() {
  const services = contentRepository.getServices();
  const contact = contentRepository.getContact();
  const [values, setValues] = useState<Omit<ContactFormValues, "consent"> & { consent: boolean }>({
    ...emptyValues,
    consent: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const whatsappHref = useMemo(() => {
    const parsed = contactFormSchema.safeParse({ ...values, consent: true });
    if (!parsed.success) {
      return `https://wa.me/${contact.whatsappE164}`;
    }
    return buildWhatsAppUrl(contact.whatsappE164, parsed.data);
  }, [contact.whatsappE164, values]);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !(field in nextErrors)) {
          nextErrors[field as keyof ContactFormValues] = issue.message;
        }
      }
      setErrors(nextErrors);
      setSubmitted(false);
      return;
    }

    setErrors({});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-xl border border-teal/30 bg-secondary p-6"
      >
        <h2 className="text-lg font-semibold text-navy">
          Solicitação registrada nesta demonstração
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          O envio foi simulado. Nenhum e-mail foi disparado e não há endpoint
          de produção. O recebimento real será integrado em etapa posterior.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            nativeButton={false}
            render={
              <a href={whatsappHref} target="_blank" rel="noreferrer" />
            }
            className="h-11 px-5"
          >
            Abrir WhatsApp com mensagem
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 px-5"
            onClick={() => {
              setSubmitted(false);
              setValues({ ...emptyValues, consent: false });
            }}
          >
            Enviar outra solicitação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field
        id="name"
        label="Nome"
        error={errors.name}
      >
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={values.name}
          aria-invalid={Boolean(errors.name)}
          className="h-11"
          onChange={(event) => update("name", event.target.value)}
        />
      </Field>
      <Field id="company" label="Empresa ou condomínio" error={errors.company}>
        <Input
          id="company"
          name="company"
          value={values.company}
          aria-invalid={Boolean(errors.company)}
          className="h-11"
          onChange={(event) => update("company", event.target.value)}
        />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="phone" label="Telefone" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            aria-invalid={Boolean(errors.phone)}
            className="h-11"
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>
        <Field id="email" label="E-mail" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            className="h-11"
            onChange={(event) => update("email", event.target.value)}
          />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="serviceType" label="Tipo de serviço" error={errors.serviceType}>
          <select
            id="serviceType"
            name="serviceType"
            value={values.serviceType}
            aria-invalid={Boolean(errors.serviceType)}
            className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => update("serviceType", event.target.value)}
          >
            <option value="">Selecione</option>
            {services.map((service) => (
              <option key={service.id} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="city" label="Cidade" error={errors.city}>
          <Input
            id="city"
            name="city"
            value={values.city}
            aria-invalid={Boolean(errors.city)}
            className="h-11"
            onChange={(event) => update("city", event.target.value)}
          />
        </Field>
      </div>
      <Field id="message" label="Mensagem" error={errors.message}>
        <Textarea
          id="message"
          name="message"
          rows={5}
          value={values.message}
          aria-invalid={Boolean(errors.message)}
          onChange={(event) => update("message", event.target.value)}
        />
      </Field>
      <div className="flex items-start gap-3">
        <Checkbox
          id="consent"
          checked={values.consent}
          aria-invalid={Boolean(errors.consent)}
          onCheckedChange={(checked) => update("consent", checked === true)}
        />
        <Label htmlFor="consent" className="text-sm font-normal leading-relaxed">
          Autorizo o uso demonstrativo destes dados apenas para simular o envio
          de orçamento. O recebimento real ainda não está integrado.
        </Label>
      </div>
      {errors.consent ? (
        <p className="text-sm text-destructive">{errors.consent}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-11 px-5">
          Enviar solicitação demonstrativa
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          className="h-11 px-5"
          render={
            <a href={whatsappHref} target="_blank" rel="noreferrer" />
          }
        >
          Abrir WhatsApp
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Esta etapa não cria endpoint nem dispara e-mail. O canal oficial atual
        permanece {contact.email} e WhatsApp {contact.whatsappDisplay}.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
