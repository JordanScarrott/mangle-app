import { z } from "zod";

// 1. Define the Mangle Schema using Zod for validation and type inference
// This schema acts as the single source of truth for the shape of your data.
const MangleSchema = z.object({
    guiding_questions: z.array(z.string()),
    mangle_facts: z.array(z.string()),
    mangle_rules: z.array(z.string()),
});

// Infer the TypeScript type directly from the Zod schema for full type safety.
type MangleSchemaType = z.infer<typeof MangleSchema>;

/**
 * Parses a streaming JSON response from a ReadableStream<string> on-the-fly.
 * This function is designed to find and parse complete JSON objects from a stream
 * that may contain one or more concatenated JSON objects across multiple string chunks.
 *
 * @param stream A ReadableStream of strings.
 * @returns An AsyncGenerator that yields successfully parsed and validated MangleSchemaType objects.
 */
export async function* streamMangleSchemaFromStringStream(
    stream: ReadableStream<string>
): AsyncGenerator<MangleSchemaType> {
    const reader = stream.getReader();
    let buffer = "";
    let braceDepth = 0;
    let objectStartIndex = -1;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                // Process any remaining content in the buffer if the stream ends unexpectedly.
                if (buffer.trim().length > 0) {
                    console.warn(
                        "Stream ended with unprocessed data in buffer:",
                        buffer
                    );
                }
                break;
            }

            // Append the new string chunk to our buffer.
            buffer += value;

            let i = 0;
            while (i < buffer.length) {
                const char = buffer[i];

                if (char === "{") {
                    if (braceDepth === 0) {
                        objectStartIndex = i; // Mark the start of a potential top-level object.
                    }
                    braceDepth++;
                } else if (char === "}") {
                    if (braceDepth > 0) {
                        braceDepth--;
                    }

                    // If we've successfully closed a top-level object.
                    if (braceDepth === 0 && objectStartIndex !== -1) {
                        const objectStr = buffer.substring(
                            objectStartIndex,
                            i + 1
                        );

                        try {
                            // Attempt to parse and validate the extracted object string.
                            const result = MangleSchema.safeParse(
                                JSON.parse(objectStr)
                            );

                            if (result.success) {
                                yield result.data; // Success! Yield the validated data.
                            } else {
                                // The object is complete but doesn't match the schema.
                                console.error(
                                    "Schema validation failed for object:",
                                    objectStr,
                                    result.error.issues
                                );
                            }
                        } catch (error) {
                            console.error(
                                "Failed to parse JSON string:",
                                objectStr,
                                error
                            );
                        }

                        // Slice the buffer to remove the object we just processed.
                        buffer = buffer.substring(i + 1);
                        // Reset scan and state for the new buffer.
                        i = -1;
                        objectStartIndex = -1;
                    }
                }
                i++;
            }
        }
    } finally {
        reader.releaseLock();
    }
}
