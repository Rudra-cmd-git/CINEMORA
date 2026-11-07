"use client";

import { Loader2, X } from "lucide-react";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, FieldLabel } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import type { ThirdPartyService } from "@/types";

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  initialData?: ThirdPartyService | null;
  isSubmitting?: boolean;
}

interface ServiceFormData {
  name: string;
  url: string;
  status: "active" | "inactive";
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export function ServiceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}: ServiceFormDialogProps) {
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "inactive">("active");
  const [errors, setErrors] = React.useState<Partial<ServiceFormData>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof ServiceFormData, boolean>>>({});

  const isEditing = initialData !== null;

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setUrl(initialData.url);
        setStatus(initialData.status);
      } else {
        setName("");
        setUrl("");
        setStatus("active");
      }
      setErrors({});
      setTouched({});
    }
  }, [open, initialData]);

  const validateField = (field: keyof ServiceFormData, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Service name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        return undefined;
      case "url":
        if (!value.trim()) return "Service URL is required";
        try {
          const parsed = new URL(value.trim());
          if (parsed.protocol !== "https:") return "URL must use HTTPS";
          if (parsed.username || parsed.password) return "URL must not contain credentials";
          if (parsed.port) return "URL must not specify a custom port";
        } catch {
          return "Please enter a valid URL";
        }
        return undefined;
      case "status":
        return undefined;
    }
  };

  const handleBlur = (field: keyof ServiceFormData, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof ServiceFormData, value: string) => {
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
    switch (field) {
      case "name":
        setName(value);
        break;
      case "url":
        setUrl(value);
        break;
      case "status":
        setStatus(value as "active" | "inactive");
        break;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nameError = validateField("name", name);
    const urlError = validateField("url", url);

    if (nameError || urlError) {
      setErrors({ name: nameError, url: urlError });
      setTouched({ name: true, url: true, status: true });
      return;
    }

    await onSubmit({ name: name.trim(), url: url.trim(), status });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,480px)]">
        <DialogTitle className="font-display text-xl font-semibold">
          {isEditing ? "Edit Service" : "Add New Service"}
        </DialogTitle>
        <DialogDescription className="mb-4">
          {isEditing
            ? "Update the third-party streaming service details."
            : "Enter the details for a new third-party streaming service."}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="service-name">Service Name</FieldLabel>
            <Input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={(e) => handleBlur("name", e.target.value)}
              placeholder="e.g., Watch21, StreamHub"
              autoComplete="off"
              aria-invalid={touched.name && !!errors.name}
              aria-describedby={touched.name && errors.name ? "name-error" : undefined}
              disabled={isSubmitting}
              className={cn(
                touched.name && errors.name && "border-crimson focus:border-crimson",
              )}
            />
            {touched.name && errors.name && (
              <p id="name-error" className="text-[11px] text-crimson" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="service-url">Service URL</FieldLabel>
            <Input
              id="service-url"
              type="url"
              value={url}
              onChange={(e) => handleChange("url", e.target.value)}
              onBlur={(e) => handleBlur("url", e.target.value)}
              placeholder="https://example.com"
              autoComplete="url"
              aria-invalid={touched.url && !!errors.url}
              aria-describedby={touched.url && errors.url ? "url-error" : undefined}
              disabled={isSubmitting}
              className={cn(
                touched.url && errors.url && "border-crimson focus:border-crimson",
              )}
            />
            {touched.url && errors.url && (
              <p id="url-error" className="text-[11px] text-crimson" role="alert">
                {errors.url}
              </p>
            )}
            <p className="text-[10.5px] text-ink-muted">
              Must be a valid HTTPS URL. No credentials or custom ports allowed.
            </p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Status</FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full h-11 rounded-md border border-line bg-surface/70 px-4 text-sm text-ink",
                    "placeholder:text-ink-muted transition-colors",
                    "focus:border-gold/60 focus:bg-surface focus:outline-none focus:ring-0",
                    "justify-between",
                    "data-[state=open]:border-gold/60 data-[state=open]:bg-surface",
                  )}
                  disabled={isSubmitting}
                  aria-haspopup="listbox"
                  aria-expanded={false}
                >
                  <span>{STATUS_OPTIONS.find((o) => o.value === status)?.label}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-full">
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleChange("status", option.value)}
                    className={cn(
                      status === option.value && "text-ink bg-white/[0.07]",
                    )}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving...
                </>
              ) : (
                isEditing
                  ? "Save Changes"
                  : "Add Service"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}