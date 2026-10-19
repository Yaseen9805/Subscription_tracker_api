const errorResponse = {
    type: "object",
    properties: {
        success: { type: "boolean", example: false },
        error: { type: "string", example: "Resource not found" },
        errors: {
            type: "array",
            description: "Present only on 400s raised by Zod request validation.",
            items: {
                type: "object",
                properties: {
                    field: { type: "string", example: "email" },
                    message: { type: "string", example: "Please provide a valid email address" },
                },
            },
        },
    },
};

const user = {
    type: "object",
    properties: {
        _id: { type: "string", example: "68afdac15b3e3878b97b4567" },
        name: { type: "string", example: "Yaseen" },
        email: { type: "string", format: "email", example: "yaseen@example.com" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

const subscription = {
    type: "object",
    properties: {
        _id: { type: "string" },
        name: { type: "string", example: "Netflix" },
        price: { type: "number", example: 15.99 },
        currency: { type: "string", enum: ["USD", "EUR", "GBP"], default: "USD" },
        frequency: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"] },
        category: {
            type: "string",
            enum: [
                "sports",
                "news",
                "entertainment",
                "lifestyle",
                "technology",
                "finance",
                "politics",
                "other",
            ],
        },
        paymentMethod: { type: "string", example: "card" },
        status: { type: "string", enum: ["active", "cancelled", "expired"], default: "active" },
        startDate: { type: "string", format: "date" },
        renewalDate: {
            type: "string",
            format: "date",
            description: "Auto-calculated from startDate + frequency if not provided.",
        },
        user: { type: "string", description: "Owning user's id" },
        workflowId: {
            type: "string",
            description: "Upstash Workflow run id, once a reminder schedule has been triggered",
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

const authResponse = {
    type: "object",
    properties: {
        success: { type: "boolean", example: true },
        message: { type: "string" },
        data: {
            type: "object",
            properties: {
                token: {
                    type: "string",
                    description: "JWT, pass as `Authorization: Bearer <token>`",
                },
                user,
            },
        },
    },
};

export default {
    openapi: "3.0.3",
    info: {
        title: "Subscription Tracker API",
        version: "1.0.0",
        description:
            "REST API for tracking recurring subscriptions -- JWT auth, subscription CRUD with automatic " +
            "renewal-date calculation, and scheduled renewal-reminder emails via Upstash Workflow + Resend.",
    },
    servers: [
        {
            url: "https://subscription-tracker-api-8cb4.onrender.com",
            description: "Live (Render)",
        },
        { url: "http://localhost:5500", description: "Local (npm run dev / docker compose up)" },
    ],
    tags: [
        { name: "Health", description: "Infra health check" },
        { name: "Auth", description: "Signup, signin, signout" },
        {
            name: "Subscriptions",
            description: "Subscription CRUD, cancellation, upcoming renewals",
        },
        { name: "Users", description: "User CRUD (self-service)" },
        {
            name: "Workflows",
            description: "Upstash Workflow entry point -- internal, not for direct client use",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
        schemas: {
            ErrorResponse: errorResponse,
            User: user,
            Subscription: subscription,
            SignupRequest: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                    name: { type: "string", minLength: 2, maxLength: 50, example: "Yaseen" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6, format: "password" },
                },
            },
            SigninRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                },
            },
            CreateSubscriptionRequest: {
                type: "object",
                required: ["name", "price", "frequency", "category", "paymentMethod", "startDate"],
                properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    price: { type: "number", minimum: 0 },
                    currency: { type: "string", enum: ["USD", "EUR", "GBP"] },
                    frequency: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"] },
                    category: {
                        type: "string",
                        enum: [
                            "sports",
                            "news",
                            "entertainment",
                            "lifestyle",
                            "technology",
                            "finance",
                            "politics",
                            "other",
                        ],
                    },
                    paymentMethod: { type: "string" },
                    startDate: {
                        type: "string",
                        format: "date",
                        description: "Must not be in the future",
                    },
                    renewalDate: {
                        type: "string",
                        format: "date",
                        description: "Optional -- auto-calculated if omitted",
                    },
                    forceWorkflow: {
                        type: "boolean",
                        description:
                            "Trigger the reminder workflow even outside NODE_ENV=production (useful for local testing)",
                    },
                },
            },
            UpdateSubscriptionRequest: {
                type: "object",
                description: "All fields optional, but at least one is required.",
                properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    price: { type: "number", minimum: 0 },
                    currency: { type: "string", enum: ["USD", "EUR", "GBP"] },
                    frequency: { type: "string", enum: ["daily", "weekly", "monthly", "yearly"] },
                    category: {
                        type: "string",
                        enum: [
                            "sports",
                            "news",
                            "entertainment",
                            "lifestyle",
                            "technology",
                            "finance",
                            "politics",
                            "other",
                        ],
                    },
                    paymentMethod: { type: "string" },
                    status: { type: "string", enum: ["active", "cancelled", "expired"] },
                    startDate: { type: "string", format: "date" },
                    renewalDate: { type: "string", format: "date" },
                },
            },
            CreateUserRequest: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                    name: { type: "string", minLength: 2, maxLength: 50 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6, format: "password" },
                },
            },
            UpdateUserRequest: {
                type: "object",
                description: "All fields optional, but at least one is required.",
                properties: {
                    name: { type: "string", minLength: 2, maxLength: 50 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6, format: "password" },
                },
            },
        },
        responses: {
            Unauthorized: {
                description: "Missing, invalid, or expired bearer token",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: { message: { type: "string", example: "Unauthorized" } },
                        },
                    },
                },
            },
            Forbidden: {
                description: "Authenticated, but not the owner of this resource",
                content: { "application/json": { schema: errorResponse } },
            },
            NotFound: {
                description: "Resource not found",
                content: { "application/json": { schema: errorResponse } },
            },
            ValidationError: {
                description: "Request body failed Zod validation",
                content: { "application/json": { schema: errorResponse } },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Health check",
                description:
                    "Reports process uptime and live database connectivity. Exempt from rate limiting, the bot-check, and request logging.",
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        status: { type: "string", example: "ok" },
                                        uptime: { type: "number", example: 123.45 },
                                        timestamp: { type: "string", format: "date-time" },
                                        database: {
                                            type: "string",
                                            enum: [
                                                "connected",
                                                "disconnected",
                                                "connecting",
                                                "disconnecting",
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/auth/signup": {
            post: {
                tags: ["Auth"],
                summary: "Create a user and receive a JWT",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SignupRequest" },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Created",
                        content: { "application/json": { schema: authResponse } },
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    409: {
                        description: "Email already registered",
                        content: { "application/json": { schema: errorResponse } },
                    },
                },
            },
        },
        "/api/v1/auth/signin": {
            post: {
                tags: ["Auth"],
                summary: "Authenticate and receive a JWT",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SigninRequest" },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "OK",
                        content: { "application/json": { schema: authResponse } },
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: {
                        description: "Invalid password",
                        content: { "application/json": { schema: errorResponse } },
                    },
                    404: {
                        description: "No user with that email",
                        content: { "application/json": { schema: errorResponse } },
                    },
                },
            },
        },
        "/api/v1/auth/signout": {
            post: {
                tags: ["Auth"],
                summary: "Sign out",
                responses: { 200: { description: "OK" } },
            },
        },
        "/api/v1/subscriptions": {
            get: {
                tags: ["Subscriptions"],
                summary: "List the authenticated user's subscriptions",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: { type: "array", items: subscription },
                                    },
                                },
                            },
                        },
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                },
            },
            post: {
                tags: ["Subscriptions"],
                summary: "Create a subscription",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateSubscriptionRequest" },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: subscription,
                                        workflow: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string", nullable: true },
                                                error: { type: "string", nullable: true },
                                                message: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/subscriptions/upcoming-renewals": {
            get: {
                tags: ["Subscriptions"],
                summary: "Active subscriptions renewing soon",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "days",
                        in: "query",
                        description: "Lookahead window in days",
                        schema: { type: "integer", default: 7 },
                    },
                ],
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: { type: "array", items: subscription },
                                    },
                                },
                            },
                        },
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                },
            },
        },
        "/api/v1/subscriptions/user/{id}": {
            get: {
                tags: ["Subscriptions"],
                summary: "Get a given user's subscriptions",
                description: "The `id` must match the authenticated user's own id.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: { type: "array", items: subscription },
                                    },
                                },
                            },
                        },
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                },
            },
        },
        "/api/v1/subscriptions/{subscriptionId}/workflow": {
            get: {
                tags: ["Subscriptions"],
                summary: "Get the Upstash workflow status for a subscription's reminders",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "subscriptionId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "OK" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: {
                        description: "Subscription not found, or has no associated workflow",
                        content: { "application/json": { schema: errorResponse } },
                    },
                    502: {
                        description: "Failed to reach Upstash to retrieve workflow status",
                        content: { "application/json": { schema: errorResponse } },
                    },
                },
            },
        },
        "/api/v1/subscriptions/{id}": {
            get: {
                tags: ["Subscriptions"],
                summary: "Get subscription details (owner only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: subscription,
                                    },
                                },
                            },
                        },
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
            put: {
                tags: ["Subscriptions"],
                summary: "Update a subscription (owner only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateSubscriptionRequest" },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: subscription,
                                    },
                                },
                            },
                        },
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
            delete: {
                tags: ["Subscriptions"],
                summary: "Delete a subscription (owner only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    200: { description: "OK" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/subscriptions/{id}/cancel": {
            put: {
                tags: ["Subscriptions"],
                summary: "Cancel a subscription (owner only)",
                description:
                    "Sets status to `cancelled`, even if the renewal date has already passed.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: subscription,
                                    },
                                },
                            },
                        },
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/users": {
            get: {
                tags: ["Users"],
                summary: "List all users (passwords excluded)",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: { type: "array", items: user },
                                    },
                                },
                            },
                        },
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                },
            },
            post: {
                tags: ["Users"],
                summary: "Create a user",
                description:
                    "Public, like signup -- but does not issue a JWT. Use /auth/signup to create an account and log in in one step.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateUserRequest" },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Created",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { success: { type: "boolean" }, data: user },
                                },
                            },
                        },
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    409: {
                        description: "Email already registered",
                        content: { "application/json": { schema: errorResponse } },
                    },
                },
            },
        },
        "/api/v1/users/{id}": {
            get: {
                tags: ["Users"],
                summary: "Get a user by id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { success: { type: "boolean" }, data: user },
                                },
                            },
                        },
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
            put: {
                tags: ["Users"],
                summary: "Update a user (self only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateUserRequest" },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "OK",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { success: { type: "boolean" }, data: user },
                                },
                            },
                        },
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
            delete: {
                tags: ["Users"],
                summary: "Delete a user (self only) -- cascades to their subscriptions",
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    200: { description: "OK" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                },
            },
        },
        "/api/v1/workflows/subscriptions/reminder": {
            post: {
                tags: ["Workflows"],
                summary: "Upstash Workflow entry point (internal)",
                description:
                    "Runs the 7/5/2/1-day renewal-reminder schedule for a subscription and sends the reminder emails. Triggered internally by QStash when a subscription is created in production; not intended for direct client calls.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: { subscriptionId: { type: "string" } },
                            },
                        },
                    },
                },
                responses: { 200: { description: "OK" } },
            },
        },
    },
};
