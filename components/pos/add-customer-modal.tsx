"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Customer } from "@/lib/pos-types";
import {
  prototypeCustomers,
  getCustomerInitials,
} from "@/lib/customers-prototype";
import { cn } from "@/lib/utils";

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCustomer: (customer: Customer) => void;
}

function formatSecondary(customer: Customer): string {
  const parts: string[] = [];
  if (customer.email) parts.push(customer.email);
  if (customer.phone) parts.push(customer.phone);
  return parts.join(" | ");
}

export function AddCustomerModal({
  open,
  onOpenChange,
  onSelectCustomer,
}: AddCustomerModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prototypeCustomers;
    return prototypeCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ?? false)
    );
  }, [search]);

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearch("");
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setSearch("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-[664px] max-w-[calc(100%-2rem)] sm:max-w-[664px] flex-col gap-6 border-0 p-0 shadow-xl"
        showCloseButton={false}
      >
        {/* Header: X left, title center, Create right */}
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f0f0f0] active:bg-[#e5e5e5]"
          >
            <X className="h-6 w-6 text-[#101010]" />
          </button>
          <DialogTitle className="flex-1 text-center text-[19px] font-semibold leading-[26px] text-[#101010]">
            Add customer
          </DialogTitle>
          <button
            type="button"
            className="rounded-full bg-[#f0f0f0] px-5 py-3 font-medium text-[16px] leading-6 text-[#101010] active:bg-[#e5e5e5]"
          >
            Create
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-6">
          <div className="flex min-h-10 w-full items-center gap-3 rounded-full border border-[#dadada] bg-white px-4 py-2">
            <Search className="h-6 w-6 shrink-0 text-[#666]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[14px] leading-[22px] text-[#101010] placeholder:text-[#666] outline-none"
            />
          </div>
        </div>

        {/* Customer list */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6">
          <div className="flex flex-col">
            {filtered.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer)}
                className={cn(
                  "flex w-full items-center gap-4 border-b border-[#f0f0f0] py-4 text-left active:bg-[#fafafa]"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f0f0f0] text-[16px] font-medium leading-6 text-[#666]">
                  {getCustomerInitials(customer)}
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <p className="font-medium text-[16px] leading-6 text-[#101010]">
                    {customer.name}
                  </p>
                  <p className="text-[14px] leading-[22px] text-[#666]">
                    {formatSecondary(customer)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
