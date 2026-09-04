import SwaggerParser from "@apidevtools/swagger-parser";
import openapiSpec from "../docs/openapi.js";

try {
    const api = await SwaggerParser.validate(structuredClone(openapiSpec));
    console.log(`Valid OpenAPI spec: "${api.info.title}" (${Object.keys(api.paths).length} paths)`);
} catch (error) {
    console.error("Invalid OpenAPI spec:", error.message);
    process.exit(1);
}
