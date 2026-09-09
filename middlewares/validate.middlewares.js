export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const details = result.error.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
        }));

        const error = new Error(details.map((d) => `${d.field}: ${d.message}`).join(", "));
        error.statusCode = 400;
        error.details = details;
        return next(error);
    }

    req.body = result.data;
    next();
};
