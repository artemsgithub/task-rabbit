import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT =
  "You are a project planning expert. Given a list of tasks and a project context, determine the best logical order based on real-world dependencies and best practices. Group tasks into named phases, estimate realistic time for each, assign priority levels, and note any key dependency or tip per task. Return ONLY valid JSON — no markdown, no explanation. The JSON must be an object with two keys: \"title\" (a short 2-5 word project title derived from the context) and \"tasks\" (the organized array).";

interface OrganizedTask {
  order: number;
  task: string;
  phase: string;
  priority: "High" | "Medium" | "Low";
  timeEstimate: string;
  dependencies: string | null;
  note: string | null;
}

interface AIResponse {
  title: string;
  tasks: OrganizedTask[];
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  let body: {
    tasks: string[];
    context: string;
    priorityOverrides?: Record<string, string>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { tasks, context, priorityOverrides } = body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return NextResponse.json(
      { error: "Please provide at least one task" },
      { status: 400 }
    );
  }

  let priorityNote = "";
  if (priorityOverrides && Object.keys(priorityOverrides).length > 0) {
    const overrideList = Object.entries(priorityOverrides)
      .map(([task, priority]) => `- "${task}": must be ${priority}`)
      .join("\n");
    priorityNote = `\n\nIMPORTANT - The user has manually set these priority levels. You MUST use exactly these priorities for the matching tasks:\n${overrideList}`;
  }

  const userMessage = `Project context: ${context || "General project"}\n\nTasks to organize:\n${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}${priorityNote}\n\nReturn a JSON object with:\n- "title": a concise 2-5 word project title based on the context\n- "tasks": an array where each object has: order (number, 1 = do first), task (string), phase (string, e.g. "Preparation", "Execution", "Finishing"), priority ("High" | "Medium" | "Low"), timeEstimate (string, e.g. "2 hours"), dependencies (string or null), note (string or null, max 12 words).`;

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

    let parsed: AIResponse;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          { error: "Failed to parse AI response as JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      return NextResponse.json(
        { error: "AI response was not a valid task plan" },
        { status: 502 }
      );
    }

    const title = parsed.title || context || "Untitled Project";

    return NextResponse.json({ title, plan: parsed.tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Anthropic API error:", message);
    return NextResponse.json(
      { error: `AI service error: ${message}` },
      { status: 502 }
    );
  }
}
