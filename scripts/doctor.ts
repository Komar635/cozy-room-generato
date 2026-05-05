import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Check = {
	name: string;
	status: "ok" | "warn" | "fail";
	detail: string;
};

const root = process.cwd();

function parseEnv(filePath: string) {
	if (!existsSync(filePath)) {
		return new Map<string, string>();
	}

	const env = new Map<string, string>();
	for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const separatorIndex = line.indexOf("=");
		if (separatorIndex === -1) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim();
		const value = line
			.slice(separatorIndex + 1)
			.trim()
			.replace(/^['"]|['"]$/g, "");
		env.set(key, value);
	}

	return env;
}

function hasUsableValue(env: Map<string, string>, key: string) {
	const value = env.get(key);
	return Boolean(
		value &&
			!value.includes("your-") &&
			!value.includes("placeholder") &&
			!value.includes("test-key"),
	);
}

async function commandExists(command: string, args: string[] = ["--version"]) {
	try {
		const proc = Bun.spawn([command, ...args], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const timeout = new Promise<number>((resolve) => {
			setTimeout(() => resolve(-1), 5000);
		});

		const exitCode = await Promise.race([proc.exited, timeout]);
		if (exitCode === -1) {
			proc.kill();
			return false;
		}

		return exitCode === 0;
	} catch {
		return false;
	}
}

async function checkPhotogrammetryHealth() {
	try {
		const response = await fetch("http://localhost:8001/health", {
			signal: AbortSignal.timeout(3000),
		});

		if (!response.ok) {
			return null;
		}

		return await response.json();
	} catch {
		return null;
	}
}

async function main() {
	const checks: Check[] = [];
	const nextEnvPath = join(root, ".env.local");
	const photogrammetryEnvPath = join(
		root,
		"services",
		"photogrammetry",
		".env",
	);
	const nextEnv = parseEnv(nextEnvPath);
	const photogrammetryEnv = parseEnv(photogrammetryEnvPath);

	checks.push({
		name: ".env.local",
		status: existsSync(nextEnvPath) ? "ok" : "fail",
		detail: existsSync(nextEnvPath)
			? "Файл найден"
			: "Создайте .env.local из .env.local.example",
	});

	for (const key of [
		"DATABASE_URL",
		"NEXTAUTH_SECRET",
		"PHOTOGRAMMETRY_SERVICE_URL",
		"YC_STORAGE_BUCKET",
		"YC_STORAGE_ACCESS_KEY",
		"YC_STORAGE_SECRET_KEY",
	]) {
		checks.push({
			name: `.env.local:${key}`,
			status: hasUsableValue(nextEnv, key) ? "ok" : "fail",
			detail: hasUsableValue(nextEnv, key)
				? "Значение заполнено"
				: "Заполните реальное значение",
		});
	}

	checks.push({
		name: "services/photogrammetry/.env",
		status: existsSync(photogrammetryEnvPath) ? "ok" : "fail",
		detail: existsSync(photogrammetryEnvPath)
			? "Файл найден"
			: "Создайте services/photogrammetry/.env из .env.example",
	});

	for (const key of ["DATABASE_URL", "YC_STORAGE_BUCKET", "COLMAP_BIN"]) {
		checks.push({
			name: `photogrammetry.env:${key}`,
			status: hasUsableValue(photogrammetryEnv, key) ? "ok" : "fail",
			detail: hasUsableValue(photogrammetryEnv, key)
				? "Значение заполнено"
				: "Заполните реальное значение",
		});
	}

	checks.push({
		name: "Docker CLI",
		status: (await commandExists("docker", ["--version"])) ? "ok" : "warn",
		detail: "Нужен для контейнерного запуска photogrammetry",
	});

	checks.push({
		name: "Docker Compose",
		status: (await commandExists("docker", ["compose", "version"]))
			? "ok"
			: "warn",
		detail: "Нужен для docker compose --profile photogrammetry up",
	});

	const health = await checkPhotogrammetryHealth();
	checks.push({
		name: "Photogrammetry service",
		status: health ? (health.colmap_available ? "ok" : "warn") : "warn",
		detail: health
			? `Сервис отвечает, COLMAP: ${health.colmap_available ? "ok" : "missing"}`
			: "Не запущен на http://localhost:8001 — это нормально, пока scan не нужен",
	});

	for (const check of checks) {
		const icon =
			check.status === "ok" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
		console.log(`${icon} ${check.name}: ${check.detail}`);
	}

	const failed = checks.filter((check) => check.status === "fail");
	if (failed.length > 0) {
		console.log("\nСледующие пункты обязательны для рабочего проекта:");
		for (const check of failed) {
			console.log(`- ${check.name}: ${check.detail}`);
		}
		process.exit(1);
	}

	console.log("\nБазовая диагностика пройдена. Можно запускать проект.");
}

await main();
