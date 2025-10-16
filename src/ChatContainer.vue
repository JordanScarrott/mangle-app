<template>
    <div>
        <main>
            <!-- API Availability Check -->

            <!-- Input Section -->
            <div>
                <h2>Inputs</h2>

                <div>
                    <!-- User and System Prompts -->
                    <div>
                        <div>
                            <label for="userPrompt">User Prompt</label>
                            <button @click="addManglePrompt">
                                Mangle Prompt
                            </button>
                            <button @click="autoManglePromptSchema">
                                Fact Schema
                            </button>
                            <button @click="autoMangleRuleSchema">
                                Rules schema
                            </button>
                            <button @click="resetSession">Reset session</button>
                            <br />
                            <textarea
                                id="userPrompt"
                                v-model="userPrompt"
                                rows="5"
                                cols="50"
                                placeholder="e.g., Write a short poem about the rain."
                            ></textarea>
                        </div>
                        <div>
                            <label for="systemPrompt"
                                >System Prompt (Optional)</label
                            ><br />
                            <textarea
                                id="systemPrompt"
                                v-model="systemPrompt"
                                rows="3"
                                cols="50"
                                placeholder="e.g., You are a helpful assistant that replies in pirate speak."
                            ></textarea>
                        </div>
                    </div>
                    <!-- Schema Input -->
                    <div>
                        <label for="schema">JSON Schema (Optional)</label><br />
                        <textarea
                            id="schema"
                            v-model="schemaString"
                            rows="8"
                            cols="50"
                            placeholder='{ "type": "object", "properties": { "sentiment": { "type": "string" } } }'
                        ></textarea>
                    </div>
                </div>

                <!-- API Test Section -->
                <div>
                    <!-- One-Shot Prompting -->
                    <div>
                        <h3>One-Shot Response</h3>
                        <p>
                            Sends the entire prompt at once and waits for the
                            full response.
                        </p>
                        <button
                            @click="streamPrompt"
                            :disabled="oneShotLoading"
                        >
                            {{ oneShotLoading ? "Generating..." : "Streaming" }}
                        </button>
                        <button
                            @click="oneShotPrompt"
                            :disabled="oneShotLoading"
                        >
                            {{
                                oneShotLoading
                                    ? "Generating..."
                                    : "Generate One-Shot"
                            }}
                        </button>
                        <div v-if="oneShotError" style="color: red">
                            <strong>Error:</strong> {{ oneShotError }}
                        </div>
                        <div v-if="result">
                            <h4>Result:</h4>
                            <pre>{{ result }}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ManglePromptSchema } from "@/mangle/ManglePromptSchema";
import { PredicateDiscoverySchema } from "@/mangle/PredicateDiscoverySchema";
import {
    mangle_systemPrompt,
    mangle_userGoal,
    predicate_discovery_sys_prompt,
    rule_definition_sys_prompt,
} from "@/mangle/prompts";
import { createMangleSchemaPrompt } from "@/prompts/gprompt";
import type { MangleSchema } from "@/types/MangleSchema";
import { ref, watch } from "vue";

const isApiAvailable = ref(false);
const userPrompt = ref(
    "Create a JSON object for a three-day travel itinerary for Paris."
);
const systemPrompt = ref("");

const schema = ref<MangleSchema>({
    guiding_questions: [],
    mangle_facts: [],
    mangle_rules: [],
});
const schemaString = ref<string>(JSON.stringify(schema.value));

function autoManglePromptSchema() {
    systemPrompt.value = predicate_discovery_sys_prompt;
    userPrompt.value = mangle_userGoal;
    schemaString.value = JSON.stringify(PredicateDiscoverySchema);
}

function autoMangleRuleSchema() {
    systemPrompt.value = rule_definition_sys_prompt();
    userPrompt.value = mangle_userGoal;
    schemaString.value = JSON.stringify(ManglePromptSchema);
}

watch(
    () => schemaString.value,
    () => {
        try {
            return JSON.parse(schemaString.value);
        } catch (e) {
            return undefined;
        }
    }
);

// One-Shot state
const result = ref("");
const oneShotLoading = ref(false);
const oneShotError = ref(null);

function addManglePrompt(): void {
    const { prompt, systemPrompt: sysPrompt } = createMangleSchemaPrompt(
        `I want to find the best laptop under $500 that has a 2k screen and also fits inside a 14" packpack.`,
        5
    );
    userPrompt.value = prompt;
    systemPrompt.value = sysPrompt;
}

const onStreamChunk = (chunk: string): void => {
    result.value = result.value + chunk;
};

const streamPrompt = async () => {
    await prompt(onStreamChunk);
};

const oneShotPrompt = async () => {
    await prompt();
};

let session: LanguageModelSession | undefined;
const resetSession = async () => await session?.destroy();
const prompt = async (onChunk?: (chunk: string) => void) => {
    const stream = !!onChunk;
    oneShotLoading.value = true;
    result.value = "";
    oneShotError.value = null;

    try {
        const abortSignal = undefined;
        if (!session) {
            session = await LanguageModel.create({
                signal: abortSignal,
                monitor: (m: any) => {
                    m.addEventListener("downloadprogress", (e: any) => {
                        console.log(
                            `LanguageModel downloaded ${Math.floor(
                                e.loaded * 100
                            )}%`
                        );
                    });
                },
                initialPrompts: systemPrompt.value
                    ? [
                          {
                              role: "system",
                              content: systemPrompt.value,
                          },
                      ]
                    : undefined,
            });
        }

        const options = schema.value
            ? {
                  responseConstraint: schema.value,
                  signal: abortSignal,
              }
            : undefined;

        if (!stream) {
            const response = await session.prompt(userPrompt.value, options);
            // Placeholder result for testing the UI
            result.value = response;
        } else {
            const stream = await session.promptStreaming(
                userPrompt.value,
                options
            );

            for await (const chunk of stream) {
                onChunk(chunk);
            }
            // for await (const parsedObject of streamMangleSchemaFromStringStream(
            //     stream
            // )) {
            //     console.log(parsedObject);
            // }
        }
    } catch (error) {
        oneShotError.value = error.message;
    } finally {
        oneShotLoading.value = false;
    }
};
</script>

<style scoped>
header {
    line-height: 1.5;
}

.logo {
    display: block;
    margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
    header {
        display: flex;
        place-items: center;
        padding-right: calc(var(--section-gap) / 2);
    }

    .logo {
        margin: 0 2rem 0 0;
    }

    header .wrapper {
        display: flex;
        place-items: flex-start;
        flex-wrap: wrap;
    }
}
</style>
