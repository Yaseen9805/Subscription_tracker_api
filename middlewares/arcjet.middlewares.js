import aj from "../config/arcjet.js";

const arcjetmiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, { requested: 1 });

    console.log("Arcjet decision:", decision.conclusion, decision.reason?.type);

    if (decision.isDenied()) {
      if (decision.reason?.type === "RATE_LIMIT") {
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
      if (decision.reason?.type === "BOT" && !(decision.reason.allowed || []).includes("POSTMAN")) {
        return res.status(403).json({ error: "Bot detected" });
      }
      return res.status(403).json({ error: "Access denied" });
    }

    next(); // allow request if not denied
  } catch (error) {
    console.error("Arcjet middleware error:", error);
    next(error);
  }
};

export default arcjetmiddleware;
