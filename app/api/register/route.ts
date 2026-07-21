import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email inválido o contraseña muy corta (mínimo 6 caracteres)." },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json({ error: "El nombre de usuario es obligatorio." }, { status: 400 });
  }

  const [existingEmail, existingName] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { name } }),
  ]);
  if (existingEmail) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 });
  }
  if (existingName) {
    return NextResponse.json({ error: "Ese nombre de usuario ya está en uso." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
