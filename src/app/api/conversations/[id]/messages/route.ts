import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { role, content } = await req.json();

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role,
        content,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error adding message:", error);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}
