import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, dedupeKey, open, onOpenChange, ...props }) {
        void duration;
        void dedupeKey;
        return (
          <Toast key={id} open={open} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onClick={() => onOpenChange?.(false)} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
} 
