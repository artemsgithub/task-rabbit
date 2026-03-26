import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT =
  "You are a project planning expert. Given a list of tasks and a project context, determine the best logical order based on real-world dependencies and best practices. Group tasks into named phases, estimate realistic time for each, assign priority levels, and note any key dependency or tip per task. Return ONLY a valid JSON array. No markdown. No explanation.";

interface OrganizedTask {
  order: number;
  task: string;
  phase: string;
  priority: "High" | "Medium" | "Low";
  timeEstimate: string;
  dependencies: string | null;
  note: string | null;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  let body: { tasks: string[]; context: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { tasks, context } = body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json(
      { error: "Please provide at least one task" },
      { status: 400 }
    );
  }

  const userMessage = `Project context: ${context || "General project"}\n\nTasks to organize:\n${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nReturn a JSON array where each object has: order (number, 1 = do first), task (string), phase (string, e.g. "Preparation", "Execution", "Finishing"), priority ("High" | "Medium" | "Low"), timeEstimate (string, e.g. "2 hours"), dependencies (string or null), note (string or null, max 12 words).`;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    let parsed: OrganizedTask[];
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return NextResponse.json(
          { error: "Failed to parse AI response as JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "AI response was not a valid task array" },
        { status: 502 }
      );
    }

    return NextResponse.json({ plan: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Anthropic API error:", message);
    return NextResponse.json(
      { error: `AI service error: ${message}` },
      { status: 502 }
    );
  }
}
