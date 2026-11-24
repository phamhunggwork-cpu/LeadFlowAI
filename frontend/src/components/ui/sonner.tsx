import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl border border-border bg-card text-foreground shadow-[0_12px_32px_-8px_rgba(15,23,42,0.12)] font-sans',
          title: 'text-sm font-semibold text-foreground',
          description: 'text-xs text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground rounded-md text-xs font-medium',
          cancelButton: 'bg-muted text-muted-foreground rounded-md text-xs font-medium',
        },
      }}
      {...props}
    />
  );
}
