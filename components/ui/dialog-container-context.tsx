'use client';

import * as React from 'react';

export interface DialogContainerContextValue {
  containerRef: React.RefObject<HTMLElement | null>;
  contained: boolean;
}

const DialogContainerContext = React.createContext<DialogContainerContextValue | null>(null);

export function DialogContainerProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DialogContainerContextValue;
}) {
  return (
    <DialogContainerContext.Provider value={value}>
      {children}
    </DialogContainerContext.Provider>
  );
}

export function useDialogContainer(): DialogContainerContextValue | null {
  return React.useContext(DialogContainerContext);
}
