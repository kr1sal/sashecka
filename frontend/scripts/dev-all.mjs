import { spawn } from "node:child_process";
import readline from "node:readline";

const services = [
  { name: "shell", workspace: "@sashecka/shell", color: "\x1b[34m" },
  { name: "auth", workspace: "@sashecka/auth-remote", color: "\x1b[35m" },
  { name: "react-app", workspace: "@sashecka/react-app-remote", color: "\x1b[32m" },
  { name: "profile-vue", workspace: "@sashecka/profile-vue-remote", color: "\x1b[36m" },
];

const reset = "\x1b[0m";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];
let shuttingDown = false;
let remainingChildren = services.length;
let exitCode = 0;

function prefixLine(serviceName, color, line) {
  process.stdout.write(`${color}[${serviceName}]${reset} ${line}\n`);
}

function attachOutput(child, service) {
  for (const stream of [child.stdout, child.stderr]) {
    if (!stream) {
      continue;
    }

    const rl = readline.createInterface({ input: stream });
    rl.on("line", (line) => {
      prefixLine(service.name, service.color, line);
    });
  }
}

function stopChildren(signal = "SIGTERM") {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  exitCode = code;
  stopChildren("SIGTERM");

  setTimeout(() => {
    if (remainingChildren > 0) {
      stopChildren("SIGKILL");
    }
  }, 3000).unref();
}

for (const service of services) {
  const child = spawn(
    npmCommand,
    ["run", "dev", "--workspace", service.workspace],
    {
      cwd: new URL("..", import.meta.url),
      env: process.env,
      stdio: ["inherit", "pipe", "pipe"],
    },
  );

  children.push(child);
  attachOutput(child, service);

  child.on("error", (error) => {
    prefixLine(service.name, service.color, `Failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    remainingChildren -= 1;

    if (!shuttingDown && (code !== 0 || signal)) {
      const reason = signal ? signal : `exit code ${code !== null ? code : 0}`;
      prefixLine(
        service.name,
        service.color,
        `Stopped unexpectedly (${reason})`,
      );
      shutdown(code !== null ? code : 1);
    }

    if (remainingChildren === 0) {
      process.exit(exitCode);
    }
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shutdown(0);
  });
}
