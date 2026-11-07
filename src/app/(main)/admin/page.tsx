"use client";

import Link from "next/link";
import { ArrowRight, Server, Database, Globe } from "lucide-react";
import * as React from "react";
import { buttonClasses } from "@/components/ui/button-styles";
import { thirdPartyServicesStore } from "@/lib/third-party-services";
import { ADMIN_ROUTES } from "@/lib/constants";

export default function AdminDashboardPage() {
  // Services live in localStorage, so this page must be a client component.
  // Subscribe to the store so the dashboard reactively reflects edits made
  // on the services page.
  const allServices = React.useSyncExternalStore(
    thirdPartyServicesStore.subscribe,
    thirdPartyServicesStore.getSnapshot,
    thirdPartyServicesStore.getServerSnapshot,
  );
  const activeServices = allServices.filter((service) => service.status === "active");

  const stats = [
    { label: "Total Services", value: String(allServices.length), icon: Database, note: "Configured in admin" },
    { label: "Active Services", value: String(activeServices.length), icon: Server, note: "Shown publicly" },
    { label: "Inactive Services", value: String(allServices.length - activeServices.length), icon: Globe, note: "Hidden from public" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-[14.5px] text-ink-soft">
          Manage third-party streaming services displayed on Cinemora.
        </p>
      </div>

      <section aria-labelledby="stats-heading" className="grid gap-4 sm:grid-cols-3">
        <h2 id="stats-heading" className="sr-only">
          Statistics
        </h2>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-elevated p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink-muted">
                  {stat.label}
                </dt>
                <dd className="mt-2 flex items-baseline gap-3">
                  <span className="cm-tabular font-display text-3xl font-semibold leading-none text-ink">
                    {stat.value}
                  </span>
                  <stat.icon className="size-6 text-gold/70 shrink-0" aria-hidden />
                </dd>
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink-muted">
                  {stat.note}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="actions-heading" className="rounded-xl border border-line bg-elevated p-6 shadow-sm">
        <h2 id="actions-heading" className="font-display text-lg font-semibold leading-tight text-ink">
          Quick Actions
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={ADMIN_ROUTES.services}
            className={buttonClasses("primary", "md")}
          >
            <Server className="size-4" aria-hidden />
            Manage Services
          </Link>
          <Link
            href="/explore"
            className={buttonClasses("outline", "md")}
          >
            <Globe className="size-4" aria-hidden />
            View Public Page
            <ArrowRight className="size-3.5 ml-1" aria-hidden />
          </Link>
        </div>
      </section>

      {allServices.length > 0 && (
        <section aria-labelledby="recent-heading" className="rounded-xl border border-line bg-elevated p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="font-display text-lg font-semibold leading-tight text-ink">
              Recent Services
            </h2>
            <Link
              href={ADMIN_ROUTES.services}
              className={buttonClasses("ghost", "sm")}
            >
              View all
              <ArrowRight className="size-3.5 ml-1" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4 hidden md:table-cell">URL</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4 hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {allServices.slice(0, 5).map((service) => (
                  <tr key={service.id} className="border-b border-line/50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ink">{service.name}</td>
                    <td className="py-3 pr-4 hidden md:table-cell text-ink-soft truncate max-w-[200px]">
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gold transition-colors underline-offset-2 hover:underline"
                      >
                        {service.url}
                      </a>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={service.status} />
                    </td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-ink-muted">
                      {new Date(service.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium
        ${status === "active"
          ? "bg-emerald/15 text-emerald ring-1 ring-inset ring-emerald/30"
          : "bg-slate/15 text-slate-400 ring-1 ring-inset ring-slate-500/30"}
      `}
    >
      <span
        className={`size-1.5 rounded-full ${status === "active" ? "bg-emerald" : "bg-slate-500"}`}
        aria-hidden
      />
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}