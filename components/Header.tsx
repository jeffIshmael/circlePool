"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const Header = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/create", label: "Create Circle" },
    { href: "/my-circles", label: "My Circles" },
    { href: "/my-loans", label: "My Loans" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <header className="w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-xl md:text-2xl font-bold text-primary-dark cursor-pointer">
                CirclePool
              </h1>
            </Link>
          </div>

          {/* Navigation - Desktop Only */}
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
          </nav>

          {/* User Actions - Desktop Only */}
          <div className="">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#243C4C] hover:opacity-70 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              Connect Wallet
            </button>
          </div>

        
        </div>

      </div>
    </header>
  );
};

export default Header;
