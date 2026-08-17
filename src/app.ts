import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import { resolve } from "node:path";
import { appendAudit, type AuditEvent } from "./audit.js";
import { sha256 } from "./hash.js";
import { detectPartyConflict, normalizeDwsFields } from "./normalize.js";
import { extractConsentDocument, type NutrientBuildResponse } from "./nutrient.js";
import { evaluateConsent } from "./policy.js";
import { recordHumanDecision } from "./review.js";

export interface AppOptions {
  extractor?: (bytes: Uint8Array, fileName: string) => Promise<NutrientBuildResponse>;
  serveStatic?: boolean;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: { redact: ["req.headers.authorization", "req.body"] } });
  const extractor = options.extractor ?? ((bytes, fileName) => extractConsentDocument(bytes, fileName));
  const reviews = new Map<string, AuditEvent>();

  await app.register(multipart, {
    limits: { files: 1, fileSize: 10 * 1024 * 1024, fields: 0 },
  });

  app.get("/api/health", async () => ({
    status: "ok",
    provider: "nutrient-dws",
    keyConfigured: Boolean(process.env.NUTRIENT_API_KEY),
  }));

  app.post("/api/analyze", async (request, reply) => {
    const part = await request.file();
    if (!part) return reply.code(400).send({ error: "one PDF file is required" });
    if (part.mimetype !== "application/pdf") return reply.code(415).send({ error: "only PDF files are accepted" });
    const bytes = await part.toBuffer();
    const inputSha256 = sha256(bytes);
    const response = await extractor(bytes, part.filename);
    const fields = normalizeDwsFields(response.body);
    const policy = evaluateConsent({
      inputSha256,
      provider: "nutrient-dws",
      providerRequestId: response.requestId,
      fields,
      signals: { partyConflict: detectPartyConflict(response.body) },
    });
    const audit = appendAudit(null, {
      inputSha256,
      schemaVersion: "consent-v1",
      policyVersion: "consent-policy-v1",
      decision: policy.decision,
      fieldStatus: policy.fieldStatus,
      humanDecision: "pending",
      humanRationale: null,
    });
    reviews.set(audit.eventHash, audit);
    return {
      provider: "nutrient-dws",
      requestId: response.requestId,
      fields,
      policy,
      audit,
    };
  });

  app.post<{ Body: { auditHash?: string; decision?: string; rationale?: string } }>("/api/review", async (request, reply) => {
    const { auditHash, decision, rationale } = request.body ?? {};
    if (!auditHash || (decision !== "approved" && decision !== "rejected") || typeof rationale !== "string") {
      return reply.code(400).send({ error: "auditHash, approved/rejected decision, and rationale are required" });
    }
    const previous = reviews.get(auditHash);
    if (!previous) return reply.code(404).send({ error: "audit event was not found in this process" });
    try {
      const audit = recordHumanDecision(previous, decision, rationale);
      reviews.set(audit.eventHash, audit);
      return { audit };
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "invalid review" });
    }
  });

  if (options.serveStatic !== false) {
    await app.register(fastifyStatic, { root: resolve("web") });
  }
  return app;
}
