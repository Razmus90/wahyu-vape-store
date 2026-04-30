'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import ChatWidget from './ChatWidget';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <ChatWidget />
    </>
  );
}
