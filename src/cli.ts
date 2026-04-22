#!/usr/bin/env node
import { runCommand } from "./commands/runCommand.js";
import { statusCommand } from "./commands/statusCommand.js";
import { intentCommand } from "./commands/intentCommand.js";

interface ParsedArgs {
  command: "run" | "status" | "intent" | "help";
  ticks: number;
  setpoint: number;
  profile: string;
  intent: string;
  result: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.command === "help") {
    printHelp();
    return;
  }

  if (args.command === "status") {
    await statusCommand();
    return;
  }

  if (args.command === "intent") {
    await intentCommand({
      intent: args.intent,
      result: args.result
    });
    return;
  }

  await runCommand({
    ticks: args.ticks,
    setpoint: args.setpoint,
    profile: args.profile
  });
}

function parseArgs(raw: string[]): ParsedArgs {
  const command = (raw[0] ?? "help") as ParsedArgs["command"];

  let ticks = 120;
  let setpoint = 10;
  let profile = "stable";
  let intent = "";
  let result = "";

  for (let i = 1; i < raw.length; i += 1) {
    if (raw[i] === "--ticks") {
      ticks = Number(raw[i + 1]);
      i += 1;
    } else if (raw[i] === "--setpoint") {
      setpoint = Number(raw[i + 1]);
      i += 1;
    } else if (raw[i] === "--profile") {
      profile = raw[i + 1] ?? profile;
      i += 1;
    } else if (raw[i] === "--intent") {
      intent = raw[i + 1] ?? "";
      i += 1;
    } else if (raw[i] === "--result") {
      result = raw[i + 1] ?? "";
      i += 1;
    }
  }

  if (!["run", "status", "intent", "help"].includes(command)) {
    return { command: "help", ticks, setpoint, profile, intent, result };
  }

  return { command, ticks, setpoint, profile, intent, result };
}

function printHelp(): void {
  console.log("PID Harness CLI (GSD-2-inspired runtime shape)");
  console.log("");
  console.log("Usage:");
  console.log("  npm run dev -- run [--ticks 120] [--setpoint 10] [--profile stable|fast]");
  console.log("  npm run dev -- status");
  console.log("  npm run dev -- intent --intent \"<goal>\" --result \"<current output>\"");
}

main().catch((error) => {
  console.error("fatal:", error);
  process.exitCode = 1;
});
