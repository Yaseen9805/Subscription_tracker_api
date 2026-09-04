import supertest from "supertest";

// Supertest doesn't send a User-Agent header by default, unlike real browsers,
// curl, or Postman -- which would otherwise trip the app's own bot-check
// middleware (middlewares/security.middlewares.js) on every request in this suite.
export const request = (app) => {
    const agent = supertest(app);
    return new Proxy(agent, {
        get(target, prop) {
            const value = target[prop];
            if (typeof value !== "function") return value;

            return (...args) => {
                const test = value.apply(target, args);
                return test.set("User-Agent", "jest-test-suite");
            };
        },
    });
};
