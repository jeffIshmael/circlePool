"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import dynamic from 'next/dynamic';
import { getHbarBalance } from "@/app/services/circleService";
import { useHashConnect } from "@/app/hooks/useHashConnect";
import Image from "next/image";

const HashConnectButton = dynamic(
  () => import('../app/components/HashConnectButton'),
  { ssr: false }
);


const Header = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected, accountId } = useHashConnect();
  const [balance, setBalance] = useState<{ tinybars: number; hbar: number }>({ tinybars: 0, hbar: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accountId) {
        setBalance({ tinybars: 0, hbar: 0 });
        return;
      }
      try {
        const b = await getHbarBalance(accountId);
        if (!cancelled) setBalance(b);
      } catch {
        if (!cancelled) setBalance({ tinybars: 0, hbar: 0 });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const navLinks = [
    { href: "/create", label: "Create Circle" },
    { href: "/my-circles", label: "My Circles" },
    { href: "/my-loans", label: "My Loans" },
    { href: "/profile", label: "Profile" },
  ];

  const truncateAccount = (id: string) =>
    id.length > 15 ? id.slice(0, 10) + "..." + id.slice(-5) : id;


  return (
    <header className="w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          
          <div className="flex-shrink-0 flex items-center gap-2">
          <Image src="/images/circleLogo.png" alt="CirclePool" width={32} height={32} className="rounded-full" />
            <Link href="/">
              <h1 className="text-xl md:text-2xl font-bold text-primary-dark cursor-pointer">
                CirclePool
              </h1>
            </Link>
          </div>

          {/* Navigation - Desktop Only */}
          {isConnected && (
          <nav className="hidden lg:flex lg:space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors rounded-full hover:z-10 ${
                    isActive
                      ? " text-primary-blue font-semibold underline"
                      : "text-gray-700 hover:text-primary-blue hover:underline hover:bg-primary-lavender"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>)}

          {/* User Actions - Desktop Only */}
          <div className="">
            <HashConnectButton hbarBalance={balance.hbar} />
          </div>

        
        </div>

      </div>
    </header>
  );
};

export default Header;
