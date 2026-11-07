#!/usr/bin/env node
// Mantém uma identidade única verificável para o grupo destacado do smoke.
import { spawn } from "node:child_process"
const child = spawn("npx", ["tsx", "src/main.ts"], { stdio: "inherit", env: process.env })
child.on("error", error => { console.error(error.message); process.exitCode = 1 })
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0) })
