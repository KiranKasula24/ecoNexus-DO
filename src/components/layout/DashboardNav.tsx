"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth/auth-helpers";

const topLinks = [
  { href: "/overview", label: "Overview" },
  { href: "/setup", label: "Setup" },
  { href: "/nexus", label: "Nexus" },
  { href: "/deals/created", label: "Deals Created" },
  { href: "/deals/pending", label: "Deals Pending" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/passports", label: "Passports" },
  { href: "/agent/settings", label: "Agent Settings" },
  { href: "/agent_analytics", label: "Agent Analytics" },
  { href: "/kpi_analytics", label: "KPI Analytics" },
];

const materialLinks = [
  { href: "/materials/flow/create", label: "Material Flow" },
  { href: "/materials/requirements", label: "Requirements" },
  { href: "/materials/upload", label: "Upload Invoice" },
];

const analyticsLinks = [
  { href: "/agent_analytics", label: "Agent Analytics" },
  { href: "/kpi_analytics", label: "KPI Analytics" },
  { href: "/agent/settings", label: "Agent Settings" },
];

const dealLinks = [
  { href: "/deals/created", label: "Created Deals" },
  { href: "/deals/pending", label: "Pending Deals" },
];

export function DashboardNav() {
  const { company } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/overview"
                className="text-xl font-bold text-blue-600 hover:text-blue-700"
              >
                EcoNexus
              </Link>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-6">
              {topLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}

              <div className="relative group inline-flex items-center">
                <button className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Deals <span className="ml-1 text-xs">v</span>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-52 bg-white shadow-lg rounded-b-lg py-2 z-50 border border-gray-100">
                  {dealLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative group inline-flex items-center">
                <button className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Materials <span className="ml-1 text-xs">v</span>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-52 bg-white shadow-lg rounded-b-lg py-2 z-50 border border-gray-100">
                  {materialLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative group inline-flex items-center">
                <button className="border-transparent text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Analytics <span className="ml-1 text-xs">v</span>
                </button>
                <div className="hidden group-hover:block absolute left-0 top-full mt-0 w-52 bg-white shadow-lg rounded-b-lg py-2 z-50 border border-gray-100">
                  {analyticsLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link
                href="/overview"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {company?.name ?? "Company"}
              </Link>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
