import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "POSTMAN"   // 👈 allows Postman requests
      ],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,  // 5 tokens per 10 seconds
      interval: 10,
      capacity: 10,   // max 10 requests before blocking
    }),
  ],
});

export default aj;
