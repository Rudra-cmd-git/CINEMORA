"use client";

import { STORAGE_KEYS } from "@/lib/constants";
import { createJsonStore } from "@/lib/storage";
import type { ThirdPartyService } from "@/types";

const EMPTY: ThirdPartyService[] = [];

function isThirdPartyService(value: unknown): value is ThirdPartyService {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ThirdPartyService).id === "string" &&
    typeof (value as ThirdPartyService).name === "string" &&
    typeof (value as ThirdPartyService).url === "string" &&
    typeof (value as ThirdPartyService).status === "string" &&
    ["active", "inactive"].includes((value as ThirdPartyService).status) &&
    typeof (value as ThirdPartyService).createdAt === "string" &&
    typeof (value as ThirdPartyService).updatedAt === "string"
  );
}

function isThirdPartyServiceArray(value: unknown): value is ThirdPartyService[] {
  return Array.isArray(value) && value.every(isThirdPartyService);
}

export const thirdPartyServicesStore = createJsonStore<ThirdPartyService[]>(
  STORAGE_KEYS.thirdPartyServices,
  EMPTY,
  isThirdPartyServiceArray,
);

/** Generate a URL-friendly ID from a name. */
function generateId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/** Validate a URL — must be HTTPS, no credentials, no custom ports. */
export function validateServiceUrl(url: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username !== "" || parsed.password !== "") return null;
  if (parsed.port !== "") return null;

  return parsed;
}

/** Get all services (sorted by name). */
export function getAllServices(): ThirdPartyService[] {
  const services = thirdPartyServicesStore.getSnapshot();
  return [...services].sort((a, b) => a.name.localeCompare(b.name));
}

/** Get only active services for public display. */
export function getActiveServices(): ThirdPartyService[] {
  return getAllServices().filter((service) => service.status === "active");
}

/** Add a new service. */
export function addService(
  name: string,
  url: string,
  status: "active" | "inactive" = "active",
): ThirdPartyService {
  const now = new Date().toISOString();
  const service: ThirdPartyService = {
    id: generateId(name),
    name: name.trim(),
    url: url.trim(),
    status,
    createdAt: now,
    updatedAt: now,
  };

  const current = thirdPartyServicesStore.getSnapshot();
  thirdPartyServicesStore.set([service, ...current]);
  return service;
}

/** Update an existing service. */
export function updateService(
  id: string,
  updates: Partial<Pick<ThirdPartyService, "name" | "url" | "status">>,
): ThirdPartyService | null {
  const current = thirdPartyServicesStore.getSnapshot();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const updated: ThirdPartyService = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const next = [...current];
  next[index] = updated;
  thirdPartyServicesStore.set(next);
  return updated;
}

/** Delete a service by ID. */
export function deleteService(id: string): boolean {
  const current = thirdPartyServicesStore.getSnapshot();
  const filtered = current.filter((s) => s.id !== id);
  if (filtered.length === current.length) return false;
  thirdPartyServicesStore.set(filtered);
  return true;
}

/** Toggle service status between active/inactive. */
export function toggleServiceStatus(id: string): ThirdPartyService | null {
  const current = thirdPartyServicesStore.getSnapshot();
  const service = current.find((s) => s.id === id);
  if (!service) return null;

  return updateService(id, { status: service.status === "active" ? "inactive" : "active" });
}

/** Get a single service by ID. */
export function getService(id: string): ThirdPartyService | undefined {
  return thirdPartyServicesStore.getSnapshot().find((s) => s.id === id);
}