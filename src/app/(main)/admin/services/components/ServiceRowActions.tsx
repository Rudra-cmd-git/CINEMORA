"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ThirdPartyService } from "@/types";

interface ServiceRowActionsProps {
  service: ThirdPartyService;
  onEdit: (service: ThirdPartyService) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function ServiceRowActions({
  service,
  onEdit,
  onDelete,
  onToggleStatus,
}: ServiceRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-ink-muted hover:text-ink hover:bg-white/[0.07]"
          aria-label={`Actions for ${service.name}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem
          onSelect={() => onEdit(service)}
          className="flex items-center gap-2"
        >
          <span className="text-[13px]">Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onToggleStatus(service.id)}
          className="flex items-center gap-2"
        >
          <span className="text-[13px]">
            {service.status === "active" ? "Deactivate" : "Activate"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => setDeleteOpen(true)}
          className="flex items-center gap-2 text-crimson focus:text-crimson"
        >
          <Trash2 className="size-3.5" aria-hidden />
          <span className="text-[13px]">Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent className="w-[min(94vw,400px)]">
        <DialogTitle className="font-display text-lg font-semibold flex items-center gap-2 text-crimson">
          <Trash2 className="size-5" aria-hidden />
          Delete Service
        </DialogTitle>
        <DialogDescription className="mb-4">
          Are you sure you want to delete <strong>{service.name}</strong>? This action cannot be
          undone.
        </DialogDescription>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => { onDelete(service.id); setDeleteOpen(false); }}>
            Delete
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}