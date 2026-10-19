import rateLimit from "express-rate-limit";

// General limiter applied to every request: generous enough for normal API use,
// tight enough to blunt brute-force/scripted abuse.
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests, please try again later" },
});

// Stricter limiter for auth routes, since signup/signin are the usual brute-force targets.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many auth attempts, please try again later" },
});

// Known scanner/attack-tool User-Agent signatures. This is not a substitute for
// real bot detection -- it's a cheap, free tripwire that catches unconfigured
// scanners and completely missing User-Agent headers, while leaving normal
// tools (curl, Postman, browsers) untouched.
const SUSPICIOUS_USER_AGENTS = [
    "sqlmap",
    "nikto",
    "nmap",
    "masscan",
    "nessus",
    "acunetix",
    "netsparker",
    "w3af",
    "havij",
    "zgrab",
    "gobuster",
    "dirbuster",
    "wpscan",
    "metasploit",
    "nuclei",
];

export const botCheck = (req, res, next) => {
    const userAgent = req.headers["user-agent"];

    if (!userAgent) {
        return res.status(403).json({ success: false, error: "Missing User-Agent header" });
    }

    const lowered = userAgent.toLowerCase();
    if (SUSPICIOUS_USER_AGENTS.some((signature) => lowered.includes(signature))) {
        return res.status(403).json({ success: false, error: "Suspicious User-Agent" });
    }

    next();
};
