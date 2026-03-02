export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || msg.parts?.map((p: any) => p.text).join("") || "",
    }));

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:7b",
        messages: [
          {
            role: "system",
            content: "You are Trip Architect, a helpful travel planning assistant.",
          },
          ...formattedMessages,
        ],
        stream: false,
      }),
    });

    const data = await response.json();

    return Response.json({
      message: data.message,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
