import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminDashboard, {
  type AdminService,
} from "@/components/admin/AdminDashboard";
import { isAdminAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shopTodayISO } from "@/lib/shop-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Appointment book",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const list: AdminService[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceCents: s.priceCents,
    category: s.category,
  }));

  return <AdminDashboard services={list} today={shopTodayISO()} />;
}
