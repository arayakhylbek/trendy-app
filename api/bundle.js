"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// apps/api/src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express8 = __toESM(require("express"));
var import_pino_http = __toESM(require("pino-http"));

// apps/api/src/lib/logger.ts
var import_pino = __toESM(require("pino"));
var logger = (0, import_pino.default)({
  level: process.env["NODE_ENV"] === "production" ? "info" : "debug",
  ...process.env["NODE_ENV"] !== "production" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true }
    }
  }
});

// packages/shared/src/plans.ts
var PLANS = {
  free: {
    id: "free",
    label: "Free",
    price: 0,
    monthlyLimit: 5,
    features: ["5 generations / month", "Limited template library", "Standard quality"]
  },
  pro: {
    id: "pro",
    label: "Pro",
    price: 19,
    monthlyLimit: 200,
    features: ["200 generations / month", "Full daily template library", "HD downloads"]
  },
  studio: {
    id: "studio",
    label: "Studio",
    price: 49,
    monthlyLimit: Infinity,
    features: [
      "Unlimited generations (fair use)",
      "Full library + early access",
      "Priority generation"
    ]
  }
};

// packages/shared/src/schemas.ts
var import_zod = require("zod");
var PlanIdSchema = import_zod.z.enum(["free", "pro", "studio"]);
var UserDocSchema = import_zod.z.object({
  uid: import_zod.z.string(),
  email: import_zod.z.string().email(),
  displayName: import_zod.z.string().nullable().default(null),
  tier: PlanIdSchema.default("free"),
  generationsUsed: import_zod.z.number().int().nonnegative().default(0),
  generationsResetAt: import_zod.z.string().datetime().optional(),
  polarCustomerId: import_zod.z.string().optional(),
  createdAt: import_zod.z.string().datetime(),
  updatedAt: import_zod.z.string().datetime()
});
var TemplateSchema = import_zod.z.object({
  id: import_zod.z.string().optional(),
  emoji: import_zod.z.string(),
  label: import_zod.z.string(),
  style: import_zod.z.string(),
  styleName: import_zod.z.string().optional(),
  cat: import_zod.z.string(),
  prompt: import_zod.z.string(),
  image: import_zod.z.string(),
  isTrending: import_zod.z.boolean().default(false),
  isNew: import_zod.z.boolean().default(false),
  isPro: import_zod.z.boolean().default(false),
  likes: import_zod.z.number().int().nonnegative().default(0),
  uses: import_zod.z.number().int().nonnegative().default(0),
  createdAt: import_zod.z.string().datetime()
});
var GenerationRunSchema = import_zod.z.object({
  date: import_zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: import_zod.z.enum(["pending", "completed", "failed"]),
  templatesGenerated: import_zod.z.number().int().nonnegative().default(0),
  startedAt: import_zod.z.string().datetime(),
  completedAt: import_zod.z.string().datetime().optional(),
  error: import_zod.z.string().optional()
});
var WebhookEventSchema = import_zod.z.object({
  eventId: import_zod.z.string(),
  type: import_zod.z.string(),
  processedAt: import_zod.z.string().datetime()
});
var CheckoutRequestSchema = import_zod.z.object({
  planId: import_zod.z.enum(["pro", "studio"])
});
var GenerateRequestSchema = import_zod.z.object({
  prompt: import_zod.z.string().min(1).max(2e3),
  imageBase64: import_zod.z.string().optional()
});

// packages/shared/src/errors.ts
var AppError = class extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "AppError";
  }
};
var UnauthorizedError = class extends AppError {
  constructor(msg = "Unauthorized") {
    super("UNAUTHORIZED", msg, 401);
  }
};
var NotFoundError = class extends AppError {
  constructor(resource) {
    super("NOT_FOUND", `${resource} not found`, 404);
  }
};
var ValidationError = class extends AppError {
  constructor(msg) {
    super("VALIDATION_ERROR", msg, 400);
  }
};
var QuotaExceededError = class extends AppError {
  constructor() {
    super("QUOTA_EXCEEDED", "Monthly generation limit reached. Upgrade your plan to continue.", 429);
  }
};
var RateLimitError = class extends AppError {
  constructor() {
    super("RATE_LIMITED", "Too many requests. Please slow down.", 429);
  }
};

// apps/api/src/middleware/errorHandler.ts
function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }
  const msg = err instanceof Error ? err.message : String(err);
  logger.error({ err, msg }, "Unhandled error");
  return res.status(500).json({
    error: { code: "INTERNAL", message: "Internal server error" }
  });
}

// apps/api/src/routes/webhooks.ts
var import_express = require("express");
var import_express2 = __toESM(require("express"));

// apps/api/src/lib/firebase.ts
var import_app = require("firebase-admin/app");
var import_firestore = require("firebase-admin/firestore");
var import_auth = require("firebase-admin/auth");
var _app = null;
function getApp() {
  if (_app) return _app;
  if ((0, import_app.getApps)().length > 0) {
    _app = (0, import_app.getApps)()[0];
    return _app;
  }
  const projectId = process.env["FIREBASE_PROJECT_ID"];
  const clientEmail = process.env["FIREBASE_CLIENT_EMAIL"];
  const privateKey = process.env["FIREBASE_PRIVATE_KEY"]?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars."
    );
  }
  _app = (0, import_app.initializeApp)({ credential: (0, import_app.cert)({ projectId, clientEmail, privateKey }) });
  return _app;
}
var db = new Proxy({}, {
  get(_target, prop) {
    return (0, import_firestore.getFirestore)(getApp())[prop];
  }
});
var adminAuth = new Proxy({}, {
  get(_target, prop) {
    return (0, import_auth.getAuth)(getApp())[prop];
  }
});

// apps/api/src/lib/polarConfig.ts
var POLAR_PRODUCT_IDS = {
  pro: process.env["POLAR_PRODUCT_PRO"] ?? "",
  studio: process.env["POLAR_PRODUCT_STUDIO"] ?? ""
};
function getPlanByProductId(productId) {
  if (!productId) return void 0;
  if (POLAR_PRODUCT_IDS.pro && POLAR_PRODUCT_IDS.pro === productId) return "pro";
  if (POLAR_PRODUCT_IDS.studio && POLAR_PRODUCT_IDS.studio === productId) return "studio";
  return void 0;
}
function getProductIdByPlan(planId) {
  return POLAR_PRODUCT_IDS[planId];
}

// apps/api/src/routes/webhooks.ts
var router = (0, import_express.Router)();
router.post("/polar", import_express2.default.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    const { validateEvent } = await import("@polar-sh/sdk/webhooks");
    event = validateEvent(
      req.body,
      req.headers,
      process.env["POLAR_WEBHOOK_SECRET"]
    );
  } catch (e) {
    const err = e;
    if (err?.name === "WebhookVerificationError" || err?.constructor?.name === "WebhookVerificationError") {
      logger.warn("Polar webhook: signature verification failed");
      res.status(403).json({ error: { code: "INVALID_SIGNATURE", message: "Invalid signature" } });
      return;
    }
    logger.warn({ err: e }, "Polar webhook: parse error");
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "Bad request" } });
    return;
  }
  const eventType = event.type ?? "unknown";
  const data = event.data;
  const idempotencyKey = `${data?.id ?? ""}-${eventType}`;
  const eventRef = db.collection("webhookEvents").doc(idempotencyKey);
  const existing = await eventRef.get();
  if (existing.exists) {
    res.json({ ok: true, skipped: true });
    return;
  }
  try {
    await handlePolarEvent(eventType, data);
    await eventRef.set({
      eventKey: idempotencyKey,
      type: eventType,
      processedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ ok: true });
  } catch (e) {
    logger.error(e, "Polar webhook: processing error");
    res.status(500).json({ error: { code: "PROCESSING_ERROR", message: "Processing failed" } });
  }
});
async function handlePolarEvent(type, data) {
  logger.info({ type }, "Processing Polar webhook");
  if (type === "subscription.active" || type === "subscription.updated") {
    const productId = data?.productId;
    const customerId = data?.customerId;
    const customerEmail = data?.customer?.email;
    if (!customerEmail) {
      logger.warn({ type }, "Webhook: no customer email");
      return;
    }
    const newTier = productId ? getPlanByProductId(productId) ?? "free" : "free";
    const snap = await db.collection("users").where("email", "==", customerEmail).limit(1).get();
    if (snap.empty) {
      logger.warn({ type }, "Webhook: user not found for email");
      return;
    }
    await snap.docs[0].ref.update({
      tier: newTier,
      polarCustomerId: customerId ?? null,
      generationsUsed: 0,
      generationsResetAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.info({ tier: newTier }, "Webhook: user tier updated");
  }
  if (type === "subscription.canceled" || type === "subscription.revoked") {
    const customerEmail = data?.customer?.email;
    if (!customerEmail) return;
    const snap = await db.collection("users").where("email", "==", customerEmail).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({
        tier: "free",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      logger.info("Webhook: user downgraded to free");
    }
  }
}
var webhooks_default = router;

// apps/api/src/routes/users.ts
var import_express3 = require("express");

// apps/api/src/middleware/auth.ts
async function ensureAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid Authorization header"));
  }
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    req.uid = decoded.uid;
    next();
  } catch (e) {
    if (e instanceof Error && e.message.includes("Firebase Admin credentials not configured")) {
      next(new UnauthorizedError("Server not configured: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required"));
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
}

// apps/api/src/services/userService.ts
async function ensureUser(uid, authUser) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap.exists) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const doc = UserDocSchema.parse({
    uid,
    email: authUser?.email ?? "",
    displayName: authUser?.displayName ?? null,
    tier: "free",
    generationsUsed: 0,
    createdAt: now,
    updatedAt: now
  });
  await ref.set(doc);
}
async function getUserDoc(uid) {
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? snap.data() : null;
}

// apps/api/src/routes/users.ts
var router2 = (0, import_express3.Router)();
router2.get("/me", ensureAuth, async (req, res, next) => {
  try {
    const user = await getUserDoc(req.uid);
    if (!user) return next(new NotFoundError("User"));
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
router2.post("/me", ensureAuth, async (req, res, next) => {
  try {
    const authUser = await adminAuth.getUser(req.uid);
    await ensureUser(req.uid, {
      email: authUser.email,
      displayName: authUser.displayName
    });
    res.json({ uid: req.uid });
  } catch (e) {
    next(e);
  }
});
var users_default = router2;

// apps/api/src/routes/templates.ts
var import_express4 = require("express");
var router3 = (0, import_express4.Router)();
var NOW = "2026-06-18T00:00:00.000Z";
var STATIC_TEMPLATES = [
  {
    id: "24",
    emoji: "\u26BE",
    label: "Baseball Stadium Cam",
    style: "Cinematic",
    styleName: "Cinematic",
    cat: "kdrama",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_mp2jsfmp2jsfmp2j.png",
    prompt: "Photorealistic broadcast TV camera screenshot of a young woman accidentally caught on live Korean baseball KBO broadcast camera, she notices the camera and gives a soft natural smile directly into the lens, relaxed and candid moment. She is seated in stadium bleachers wearing a dark navy Doosan Bears jersey. She is holding red thunder sticks loosely in her lap. Background is softly blurred \u2014 a few calm seated fans behind her, no chaos or movement. Stadium lighting is cool blue-tinted LED floodlights, cinematic night game atmosphere. Shallow depth of field, subject is sharp and in focus. Framed as a live TV broadcast screenshot: scoreboard graphic overlay in top-left corner with Korean team names and score, fictional Korean sports channel logo top-right corner reading 'KSBN LIVE' in clean broadcast font. Lower-third Korean text subtitle visible at bottom. The overall feel is calm, beautiful, intimate \u2014 like a quiet moment caught by the broadcast camera. Hyper-realistic, 4K broadcast quality, film grain, cinematic."
  },
  {
    id: "25",
    emoji: "\u{1F495}",
    label: "Fashion Doll",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_7aatlu7aatlu7aat.png",
    prompt: "Ultra-stylish fashion editorial photo transformed into a living doll aesthetic. Subject styled as a hyper-glamorous Y2K fashion doll \u2014 flawless porcelain skin, big sparkling eyes with lash extensions, glossy pink lips, perfectly sculpted cheekbones. Wearing a chic pink mini dress with satin ribbon details, pearl accessories, and platform heels. Background is a dreamy pastel pink studio with soft bokeh. Lighting is high-key fashion photography with ring light catchlights in the eyes. The overall feel is playful, luxurious, and fashion-forward \u2014 like a Barbie come to life. Hyper-realistic, editorial quality, 4K, fashion magazine cover aesthetic."
  },
  {
    id: "26",
    emoji: "\u{1F4F8}",
    label: "Magazine Cover",
    style: "Editorial",
    styleName: "Editorial",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_b5jmleb5jmleb5jm.png",
    prompt: "Hyper-realistic high-fashion magazine cover photo shoot. Subject transformed into a stunning editorial model on the cover of a prestigious fashion magazine. Flawless retouched skin, dramatic makeup \u2014 sharp contour, bold lip, sculpted brows. Wearing a couture designer outfit \u2014 structured blazer or avant-garde dress in bold color. Shot against a clean studio background or iconic cityscape. Lighting is dramatic fashion photography \u2014 strong key light, sculpted shadows, magazine-quality retouching. Magazine logo in bold serif font at the top, cover lines with fashion headlines overlaid. The overall feel is powerful, glamorous, and iconic \u2014 a real magazine cover moment. Hyper-realistic, 4K, Vogue/Harper's Bazaar editorial quality."
  },
  {
    id: "27",
    emoji: "\u{1F324}\uFE0F",
    label: "Windy Day",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: true,
    isNew: false,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_w4se3zw4se3zw4se.png",
    prompt: "Cinematic outdoor portrait on a beautifully windy day. Subject's hair flowing naturally in the breeze, candid and carefree expression. Soft natural daylight with scattered clouds creating dynamic shadow play. Subject wearing a light flowy dress or oversized jacket. Background is an open field, coastal cliff, or city street with leaves drifting past. The wind adds movement and life to every element of the frame \u2014 hair, fabric, surrounding foliage. Shallow depth of field, warm-toned color grade, film photography aesthetic. The overall mood is free-spirited, romantic, and effortlessly beautiful. Hyper-realistic, 4K, editorial outdoor photography."
  },
  {
    id: "28",
    emoji: "\u2728",
    label: "Golden Hour",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_x0qd5xx0qd5xx0qd.png",
    prompt: "Stunning golden hour portrait bathed in warm sunset light. Subject glowing with the magical hour light \u2014 skin luminous with warm orange and amber tones, soft rim lighting creating a natural halo effect. Shot outdoors \u2014 open field, rooftop, beach, or hilltop. The sun is low on the horizon creating long shadows and lens flares. Subject is relaxed and radiant, wearing something light and airy. Background sky is a gradient of deep orange, pink, and purple. The overall mood is dreamy, warm, and cinematic \u2014 the perfect end-of-day glow. Hyper-realistic, 4K, golden hour photography."
  },
  {
    id: "29",
    emoji: "\u{1F305}",
    label: "Morning Glow",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_y38do0y38do0y38d.png",
    prompt: "Soft and luminous morning portrait in the first light of day. Subject waking up to gentle sunrise light streaming through sheer curtains or captured outdoors at dawn. Skin looks dewy and naturally glowing \u2014 warm peachy tones, minimal makeup, fresh-faced beauty. Wearing a cozy oversized sweater, silk robe, or simple white outfit. Background is soft and airy \u2014 bedroom window, balcony, or misty morning landscape. Light is diffused and golden, creating an ethereal haze. The overall mood is calm, intimate, and beautifully soft \u2014 the quiet magic of early morning. Hyper-realistic, 4K, soft morning light photography."
  },
  {
    id: "30",
    emoji: "\u{1F497}",
    label: "Hotel Glam",
    style: "Aesthetic",
    styleName: "Aesthetic",
    cat: "aesthetic",
    isTrending: true,
    isNew: false,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_aqvtgtaqvtgtaqvt.png",
    prompt: "Ultra-glamorous luxury hotel room portrait. Subject looking effortlessly chic in a five-star hotel setting \u2014 marble bathroom, plush king-size bed with crisp white linens, floor-to-ceiling windows with city skyline view. Dressed in a silk slip dress or elegant loungewear. Makeup is polished and glam \u2014 glossy lips, defined eyes. Lighting is a mix of warm bedside lamps and cool ambient window light creating a moody, luxurious atmosphere. The vibe is aspirational travel content meets fashion editorial \u2014 rich textures, opulent details, cinematic color grade. Hyper-realistic, 4K, luxury lifestyle photography."
  },
  {
    id: "31",
    emoji: "\u{1F3AC}",
    label: "Scream Night",
    style: "Horror",
    styleName: "Horror",
    cat: "aesthetic",
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: "/templates/Gemini_Generated_Image_a3rcpta3rcpta3rc.png",
    prompt: "Cinematic horror movie still inspired by classic slasher films. Subject styled as the iconic final girl \u2014 wide frightened eyes, disheveled hair, torn or blood-splattered clothing. Scene set at night in a dark suburban street, haunted house, or dimly lit corridor. Dramatic chiaroscuro lighting with harsh shadows and a single flickering light source. Color grade is desaturated with deep blues and harsh white highlights \u2014 classic horror film look. The overall atmosphere is terrifying, suspenseful, and cinematic \u2014 like a frame from a 90s horror blockbuster. Hyper-realistic, 4K, horror film cinematography."
  }
];
function isFirebaseUnconfigured(e) {
  return e instanceof Error && e.message.includes("Firebase Admin credentials not configured");
}
router3.get("/", async (req, res, next) => {
  try {
    const { cat, limit: limitStr } = req.query;
    const limit = Math.min(Number(limitStr) || 50, 100);
    let query = db.collection("templates").orderBy("createdAt", "desc").limit(limit);
    if (typeof cat === "string" && cat !== "all") {
      if (cat === "trending") {
        query = db.collection("templates").where("isTrending", "==", true).orderBy("createdAt", "desc").limit(limit);
      } else {
        query = db.collection("templates").where("cat", "==", cat).orderBy("createdAt", "desc").limit(limit);
      }
    }
    const snap = await query.get();
    const templates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ templates });
  } catch (e) {
    if (isFirebaseUnconfigured(e)) {
      let templates = STATIC_TEMPLATES;
      const { cat } = req.query;
      if (typeof cat === "string" && cat !== "all") {
        if (cat === "trending") {
          templates = STATIC_TEMPLATES.filter((t) => t.isTrending);
        } else {
          templates = STATIC_TEMPLATES.filter((t) => t.cat === cat);
        }
      }
      return res.json({ templates });
    }
    next(e);
  }
});
router3.get("/:id", async (req, res, next) => {
  try {
    const snap = await db.collection("templates").doc(req.params.id).get();
    if (!snap.exists) return next(new NotFoundError("Template"));
    res.json({ template: { id: snap.id, ...snap.data() } });
  } catch (e) {
    if (isFirebaseUnconfigured(e)) {
      const template = STATIC_TEMPLATES.find((t) => t.id === req.params.id);
      if (!template) return next(new NotFoundError("Template"));
      return res.json({ template });
    }
    next(e);
  }
});
var templates_default = router3;

// apps/api/src/routes/billing.ts
var import_express5 = require("express");

// apps/api/src/middleware/rateLimit.ts
var store = /* @__PURE__ */ new Map();
function rateLimit(maxPerMinute) {
  return (req, _res, next) => {
    const key = req.uid ?? (req.ip ?? "unknown");
    const now = Date.now();
    const entry = store.get(key) ?? { count: 0, resetAt: now + 6e4 };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + 6e4;
    }
    entry.count++;
    store.set(key, entry);
    if (entry.count > maxPerMinute) {
      return next(new RateLimitError());
    }
    next();
  };
}

// apps/api/src/lib/polar.ts
var import_sdk = require("@polar-sh/sdk");
var _polar;
function getPolar() {
  if (_polar) return _polar;
  _polar = new import_sdk.Polar({
    accessToken: process.env["POLAR_ACCESS_TOKEN"],
    server: process.env["POLAR_SERVER"] ?? "sandbox"
  });
  return _polar;
}

// apps/api/src/services/polarService.ts
async function createCheckoutSession(productId, successUrl, customerEmail) {
  const polar = getPolar();
  const checkout = await polar.checkouts.create({
    productId,
    successUrl,
    customerEmail
  });
  return checkout.url;
}
async function createCustomerPortalSession(customerId) {
  const polar = getPolar();
  const session = await polar.customerSessions.create({ customerId });
  return session.customerPortalUrl;
}

// apps/api/src/routes/billing.ts
var router4 = (0, import_express5.Router)();
router4.post("/checkout", ensureAuth, rateLimit(5), async (req, res, next) => {
  try {
    const parsed = CheckoutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { planId } = parsed.data;
    const productId = getProductIdByPlan(planId);
    if (!productId) {
      return next(new ValidationError("Invalid plan"));
    }
    const authUser = await adminAuth.getUser(req.uid);
    const successUrl = `${process.env["APP_BASE_URL"]}/billing/success?plan=${planId}`;
    const checkoutUrl = await createCheckoutSession(
      productId,
      successUrl,
      authUser.email
    );
    res.json({ checkoutUrl });
  } catch (e) {
    next(e);
  }
});
router4.post("/portal", ensureAuth, async (req, res, next) => {
  try {
    const snap = await db.collection("users").doc(req.uid).get();
    const polarCustomerId = snap.data()?.["polarCustomerId"];
    if (!polarCustomerId) {
      return next(new AppError("NO_BILLING_ACCOUNT", "No billing account found", 400));
    }
    const portalUrl = await createCustomerPortalSession(polarCustomerId);
    res.json({ portalUrl });
  } catch (e) {
    next(e);
  }
});
var billing_default = router4;

// apps/api/src/routes/generate.ts
var import_express6 = require("express");
var import_firestore2 = require("firebase-admin/firestore");

// apps/api/src/middleware/quota.ts
async function checkQuota(req, _res, next) {
  try {
    const snap = await db.collection("users").doc(req.uid).get();
    if (!snap.exists) {
      return next(new NotFoundError("User"));
    }
    const user = snap.data();
    const tier = user["tier"] ?? "free";
    const plan = PLANS[tier] ?? PLANS.free;
    if (plan.monthlyLimit === Infinity) {
      return next();
    }
    const used = user["generationsUsed"] ?? 0;
    if (used >= plan.monthlyLimit) {
      return next(new QuotaExceededError());
    }
    next();
  } catch (e) {
    next(e);
  }
}

// apps/api/src/ai/ClaudePromptEnhancer.ts
var ClaudePromptEnhancer = class {
  async enhance(basePrompt, imageBase64) {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      return basePrompt;
    }
    const messages = [
      {
        role: "user",
        content: imageBase64 ? [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: imageBase64 }
          },
          {
            type: "text",
            text: `You are an expert AI image generation prompt engineer. The user wants to create a stylized photo using this template:

${basePrompt}

Analyze the uploaded photo and enhance the template prompt to perfectly incorporate the person's features (skin tone, hair color, face shape, etc.) while maintaining the template's artistic style. Return ONLY the enhanced prompt, no explanations.`
          }
        ] : [
          {
            type: "text",
            text: `Enhance this AI image generation prompt to be more vivid and detailed while keeping the same style and mood. Return ONLY the enhanced prompt:

${basePrompt}`
          }
        ]
      }
    ];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        messages
      })
    });
    if (!res.ok) {
      return basePrompt;
    }
    const data = await res.json();
    const textBlock = data.content?.find((b) => b.type === "text");
    return textBlock?.text ?? basePrompt;
  }
};

// apps/api/src/ai/GeminiProvider.ts
async function geminiPost(endpoint, body) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new AppError("MISSING_CONFIG", "GEMINI_API_KEY not configured", 500);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55e3)
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AppError("GEMINI_ERROR", `Gemini API error ${res.status}: ${detail}`, 502);
  }
  return res.json();
}
var GeminiProvider = class {
  async generateTemplateConcept(trend) {
    const contextHint = trend.trendContext ? `
Context: ${trend.trendContext}` : "";
    const keywordsHint = trend.keywords?.length > 0 ? `
Related hashtags: ${trend.keywords.join(", ")}` : "";
    const prompt = `You are a creative director for a viral photo app. Create an AI photo template concept.

Trend: "${trend.topic}" (${trend.category})${contextHint}${keywordsHint}

The template will be used so users can insert their face/photo into a generated scene. Design it to be:
- Highly shareable on TikTok/Instagram
- Photorealistic, cinematic quality
- Have a clear aesthetic identity

Return ONLY valid JSON with these fields:
{
  "emoji": "single relevant emoji",
  "label": "catchy 2-3 word name",
  "style": "style descriptor (1-2 words, e.g. Cinematic, Ethereal, Editorial)",
  "cat": "one of: kdrama, aesthetic, anime, fantasy, vintage, fashion, nature, urban",
  "prompt": "detailed image generation prompt (100-150 words): describe the full scene, lighting, colors, mood, camera angle, background details. Include 'face placeholder area' or 'portrait position' for where the user's face will go. Optimized for Gemini image generation."
}`;
    const result = await geminiPost("gemini-2.0-flash:generateContent", {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 }
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError("GEMINI_PARSE_ERROR", "Failed to parse concept response", 502);
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      emoji: parsed.emoji ?? "\u2728",
      label: parsed.label ?? trend.topic,
      style: parsed.style ?? "Aesthetic",
      cat: parsed.cat ?? "aesthetic",
      prompt: parsed.prompt ?? ""
    };
  }
  // Generates a template preview image (no user face)
  async generateTemplateImage(concept) {
    const result = await geminiPost(
      "gemini-2.0-flash-preview-image-generation:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: `Create a stunning, photorealistic template preview image for social media.

Style: ${concept.style} | Category: ${concept.cat}
Label: ${concept.label} ${concept.emoji}

Image generation prompt:
${concept.prompt}

Requirements:
- Photorealistic, professional photography quality
- Cinematic lighting and composition
- Leave a natural portrait/face area visible in the foreground
- Do NOT include a real human face, show the scene empty or with a silhouette placeholder
- Ultra high quality, 4K detail`
              }
            ]
          }
        ],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      }
    );
    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError("GEMINI_NO_IMAGE", "No image returned from Gemini", 502);
    }
    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }
  // Generates a personalized image using the user's uploaded face photo + template prompt
  async generateUserImage(templatePrompt, userImageBase64) {
    const parts = [];
    if (userImageBase64) {
      const base64Data = userImageBase64.replace(/^data:[^;]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
      parts.push({
        text: `You have the user's photo above. Apply this visual style template to them:

${templatePrompt}

Instructions:
- Preserve the person's facial features, skin tone, and likeness
- Apply the template's background, lighting, color grade, and artistic style
- Blend the person naturally into the scene
- Output a high-quality, photorealistic, portrait-format image
- Make it look like a professional styled photo shoot`
      });
    } else {
      parts.push({
        text: `Generate a high-quality, photorealistic styled portrait image:

${templatePrompt}

Create a beautiful, magazine-quality photo that would go viral on TikTok and Instagram.
Portrait orientation, cinematic lighting, ultra-detailed.`
      });
    }
    const result = await geminiPost(
      "gemini-2.0-flash-preview-image-generation:generateContent",
      {
        contents: [{ parts }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      }
    );
    const responseParts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError("GEMINI_NO_IMAGE", "No image returned from Gemini", 502);
    }
    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }
};

// apps/api/src/routes/generate.ts
var router5 = (0, import_express6.Router)();
router5.post("/", ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64 } = parsed.data;
    const enhancer = new ClaudePromptEnhancer();
    const enhancedPrompt = await enhancer.enhance(prompt, imageBase64);
    const gemini = new GeminiProvider();
    const imageDataUri = await gemini.generateUserImage(enhancedPrompt, imageBase64);
    await db.collection("users").doc(req.uid).update({
      generationsUsed: import_firestore2.FieldValue.increment(1),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json({ image: imageDataUri, prompt: enhancedPrompt });
  } catch (e) {
    next(e);
  }
});
var generate_default = router5;

// apps/api/src/routes/cron.ts
var import_express7 = require("express");

// apps/api/src/ai/TikTokTrendSource.ts
async function fetchTikTokTrends() {
  try {
    const url = "https://ads.tiktok.com/business/creativecenter/api/v1/trending_hashtags/list?" + new URLSearchParams({
      period: "7",
      country_code: "US",
      page_size: "20"
    });
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Referer: "https://ads.tiktok.com/business/creativecenter/inspiration/trending/hashtag/pc/en",
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "TikTok Creative Center returned non-200");
      return [];
    }
    const json = await res.json();
    const list = json?.data?.list ?? [];
    return list.map((item, i) => ({
      name: (item.hashtag_name ?? "").replace(/^#/, ""),
      type: "hashtag",
      score: Math.max(1, 10 - i),
      source: "tiktok"
    })).filter((t) => t.name.length > 0).slice(0, 15);
  } catch (e) {
    logger.warn({ err: e }, "TikTok trend fetch failed");
    return [];
  }
}

// apps/api/src/ai/PinterestTrendSource.ts
var SEED_QUERIES = ["aesthetic", "outfit", "vintage", "dreamy", "editorial"];
async function fetchPinterestTrends() {
  const results = [];
  for (const seed of SEED_QUERIES) {
    try {
      const url = `https://www.pinterest.com/resource/SearchBarResource/get/?` + new URLSearchParams({
        source_url: "/",
        data: JSON.stringify({
          options: { q: seed, article: "pin", corpus: "pins", followed_only: false, bookmarks: [] },
          context: {}
        }),
        _: String(Date.now())
      });
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          "X-Pinterest-AppState": "active",
          Accept: "application/json"
        },
        signal: AbortSignal.timeout(6e3)
      });
      if (!res.ok) continue;
      const json = await res.json();
      const items = json?.resource_response?.data ?? json?.resource_response?.items ?? [];
      for (const item of items.slice(0, 4)) {
        const name = item.display_name ?? item.term ?? item.query ?? "";
        if (name) {
          results.push({ name, type: "keyword", score: 6, source: "pinterest" });
        }
      }
    } catch (e) {
      logger.warn({ err: e, seed }, "Pinterest trend fetch failed for seed");
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return results.filter((t) => {
    const key = t.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// apps/api/src/ai/GeminiTrendSource.ts
async function geminiGroundedSearch(prompt) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new AppError("MISSING_CONFIG", "GEMINI_API_KEY not configured", 500);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    }
  );
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new AppError("GEMINI_ERROR", `Gemini grounded search error ${res.status}: ${err}`, 502);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
var GeminiTrendSource = class {
  async getTrendingTopics() {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const [tikTokRaw, pinterestRaw] = await Promise.all([
      fetchTikTokTrends().catch(() => []),
      fetchPinterestTrends().catch(() => [])
    ]);
    logger.info(
      { tikTokCount: tikTokRaw.length, pinterestCount: pinterestRaw.length },
      "Scraped raw trends"
    );
    const rawSignals = [
      ...tikTokRaw.slice(0, 10).map((t) => `TikTok: #${t.name}`),
      ...pinterestRaw.slice(0, 8).map((t) => `Pinterest: "${t.name}"`)
    ].join("\n");
    const prompt = `Today is ${today}. You are a visual trend analyst for a photo editing app.

${rawSignals.length > 0 ? `Here are signals from real platforms scraped right now:
${rawSignals}

` : ""}Use Google Search to find what visual aesthetics, photo styles, and fashion trends are viral TODAY on TikTok and Pinterest.

Generate 8 distinct AI photo template ideas based on what's actually trending. Each template should:
- Be a visual aesthetic people want to recreate in photos of themselves
- Be inspired by real viral TikTok/Pinterest content today
- Have a unique, scroll-stopping style

Return a JSON array (no markdown) where each object has:
- topic: specific trend name (3-5 words, e.g. "Dark Academia Library Look", "Soft Cottagecore Picnic")
- category: one of: kdrama, aesthetic, anime, fantasy, vintage, fashion, nature, urban
- keywords: array of 4 TikTok/Pinterest hashtags without # symbol
- score: relevance score 1-10 (10 = most viral right now)
- source: "tiktok" | "pinterest" | "google"
- trendContext: one sentence describing WHY this is trending right now

Return ONLY the JSON array.`;
    let text = "";
    try {
      text = await geminiGroundedSearch(prompt);
    } catch (e) {
      logger.warn({ err: e }, "Gemini grounded search failed, falling back to ungrounded");
      const apiKey = process.env["GEMINI_API_KEY"];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
          })
        }
      );
      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new AppError("GEMINI_PARSE_ERROR", "Failed to parse Gemini trends response", 502);
    }
    const trends = JSON.parse(jsonMatch[0]);
    return trends.map((t) => ({
      topic: t.topic ?? "Trending Aesthetic",
      category: t.category ?? "aesthetic",
      keywords: Array.isArray(t.keywords) ? t.keywords : [],
      score: typeof t.score === "number" ? t.score : 5,
      source: t.source ?? "google",
      trendContext: t.trendContext
    })).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
};

// apps/api/src/routes/cron.ts
var router6 = (0, import_express7.Router)();
var TEMPLATES_PER_RUN = 6;
router6.post("/generate-daily", async (req, res) => {
  if (req.headers["authorization"] !== `Bearer ${process.env["CRON_SECRET"]}`) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } });
    return;
  }
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const runRef = db.collection("generationRuns").doc(date);
  const existing = await runRef.get();
  if (existing.exists && existing.data()?.["status"] === "completed") {
    res.json({ ok: true, skipped: true, date });
    return;
  }
  await runRef.set({
    date,
    status: "pending",
    templatesGenerated: 0,
    startedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ ok: true, date, status: "running" });
  runGeneration(date, runRef).catch((e) => {
    logger.error(e, "Daily generation crashed");
  });
});
async function runGeneration(date, runRef) {
  const trendSource = new GeminiTrendSource();
  const gemini = new GeminiProvider();
  let count = 0;
  const errors = [];
  try {
    logger.info({ date }, "Fetching trends from TikTok, Pinterest, and Gemini Search");
    const trends = await trendSource.getTrendingTopics();
    logger.info({ date, trendCount: trends.length }, "Got trends, generating templates");
    const topTrends = trends.slice(0, TEMPLATES_PER_RUN);
    for (const trend of topTrends) {
      try {
        logger.info({ topic: trend.topic, source: trend.source }, "Generating template");
        const concept = await gemini.generateTemplateConcept(trend);
        const imageDataUri = await gemini.generateTemplateImage(concept);
        await db.collection("templates").add({
          emoji: concept.emoji,
          label: concept.label,
          style: concept.style,
          cat: concept.cat,
          prompt: concept.prompt,
          image: imageDataUri,
          // matches TemplateSchema
          trendTopic: trend.topic,
          trendSource: trend.source,
          trendKeywords: trend.keywords,
          trendContext: trend.trendContext ?? null,
          isTrending: true,
          isNew: true,
          isPro: false,
          likes: 0,
          uses: 0,
          generatedDate: date,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        count++;
        logger.info({ topic: trend.topic, count }, "Template generated and saved");
      } catch (e) {
        const msg = `${trend.topic}: ${String(e)}`;
        errors.push(msg);
        logger.error(e, `Failed to generate template for trend: ${trend.topic}`);
      }
    }
    await runRef.update({
      status: "completed",
      templatesGenerated: count,
      errors: errors.length > 0 ? errors : null,
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    logger.info({ date, count, errors: errors.length }, "Daily generation completed");
  } catch (e) {
    logger.error(e, "Daily generation failed");
    await runRef.update({
      status: "failed",
      error: String(e),
      templatesGenerated: count
    });
  }
}
var cron_default = router6;

// apps/api/src/index.ts
var app = (0, import_express8.default)();
var allowedOrigins = [
  process.env["APP_BASE_URL"] ?? "http://localhost:5173",
  "http://localhost:5173"
];
app.use((req, res, next) => {
  const origin = req.headers.origin ?? "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
app.use((0, import_pino_http.default)({ logger }));
app.use("/api/webhooks", webhooks_default);
app.use(import_express8.default.json({ limit: "20mb" }));
app.use("/api/users", users_default);
app.use("/api/me", (req, res, next) => {
  req.url = "/me" + req.url;
  users_default(req, res, next);
});
app.use("/api/templates", templates_default);
app.use("/api/billing", billing_default);
app.use("/api/generate", generate_default);
app.use("/api/cron", cron_default);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use(errorHandler);
var PORT = process.env["PORT"] ?? 3001;
if (!process.env["VERCEL"] && process.env["NODE_ENV"] !== "test") {
  app.listen(PORT, () => {
    logger.info(`API server running on port ${PORT}`);
  });
}
var index_default = app;
