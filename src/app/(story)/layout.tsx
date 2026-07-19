import type { ReactNode } from "react";

/**
 * Chrome-free shell so individual Web Stories open fullscreen
 * (like Google Web Stories / major news portals).
 */
export default function StoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black text-white">
      {children}
    </div>
  );
}
