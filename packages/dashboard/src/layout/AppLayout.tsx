import type { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-7">{children}</div>
      </main>
    </div>
  );
}
