import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const EMAIL = process.env.ADMIN_EMAIL!;
const PASSWORD = process.env.ADMIN_PASSWORD!;

async function main() {
  if (!EMAIL || !PASSWORD)
    throw new Error("ADMIN_EMAIL / ADMIN_PASSWORD requis");

  const existing = await db.query.user.findFirst({
    where: eq(user.email, EMAIL),
  });
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email: EMAIL, password: PASSWORD, name: "Admin" },
    });
  }

  // Le rôle est en input:false → on le force en SQL direct
  await db.update(user).set({ role: "admin" }).where(eq(user.email, EMAIL));
  console.log(`✅ Admin: ${EMAIL}`);
  process.exit(0);
}

main();
