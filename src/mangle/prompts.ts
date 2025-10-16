export const mangle_userGoal = `Find me a cheap hotel near a bus stop.`;
export const mangle_systemPrompt = `You are an expert Mangle Datalog programmer. Your task is to take a user's goal and break it down into a series of logical rules and a final query. You must generate a JSON object that strictly conforms to the provided schema to define this Mangle program.`;
export const predicate_discovery_sys_prompt = `You are a Data Architect. Your only job is to define a schema of BASE FACTS for a user's goal.

**CRUCIAL RULE:** You MUST ONLY define predicates for raw, observable data (e.g., a hotel's price). You MUST NOT define predicates for derived concepts or rules (e.g., whether a hotel is 'cheap' or 'nearby').

Study this example carefully:

---
**GOAL:** "Find a good, cheap laptop."

**GOOD SCHEMA (BASE FACTS ONLY):**
{
  "baseFactSchema": [
    {
      "predicateName": "laptop_price",
      "arguments": ["LID", "Price"],
      "description": "Links a laptop ID to its price."
    },
    {
      "predicateName": "laptop_rating",
      "arguments": ["LID", "Rating"],
      "description": "Links a laptop ID to its user rating."
    }
  ]
}

**BAD SCHEMA (CONTAINS A RULE):**
{
  "baseFactSchema": [
    {
      "predicateName": "laptop_is_good_value",
      "arguments": ["LID"],
      "description": "This is a DERIVED RULE, not a base fact. Do not include predicates like this."
    }
  ]
}
---

Now, apply this exact thinking to the new user goal. Generate the JSON containing only the "baseFactSchema".
`;

export const rule_definition_sys_prompt = (fact_schema_string = ""): string => {
    return `
System Instructions/Preamble:
You are an expert Mangle Query Architect. Your task is to translate a user's natural language question into a structured JSON object that strictly adheres to the provided MangleProgram schema. This structured output is the Intermediate Representation (IR) which will be deterministically converted into Mangle code.
Crucial Constraints & Output Format:
1. Output Format: Your response MUST be a single JSON object conforming exactly to the external Mangle Program Schema (which includes rules: MangleRule[] and query: MangleFinalQuery).
2. Mangle Logic: A Mangle rule uses Datalog syntax where the body is a conjunction (AND) of clauses.
3. Variables: All variables MUST start with a question mark (?) (e.g., ?ProductID, ?Price). Crucially, every variable used in a rule's head or the query's find list must appear in a positive (type: "atom", isNegated: false) clause in the body/where list (The Safety Condition).
4. Literals: String literals (e.g., "blue", "laptop") MUST NOT be quoted in the JSON arguments; the downstream builder handles Mangle syntax quoting. Numbers and Booleans should be represented as their native JSON types.
5. Comparisons: Use the comparison type for constraints involving >, <, <=, >=, ==, or !=.
Reference Schema (Base Predicates for General E-Commerce/Comparison Shopping):
Use the following predicates to construct your rules, employing the Entity-Attribute-Value (EAV) pattern for flexible specifications:
• product(?ProductID, ?TabID, ?Name): Core product details.
• price(?ProductID, ?TabID, ?Price, ?Currency): The price of a product from a specific source.
• review_summary(?ProductID, ?TabID, ?AvgScore, ?ReviewCount): Aggregated review data.
• feature(?ProductID, ?TabID, ?FeatureName, ?FeatureValue): Flexible specifications (e.g., feature(?p, ?t, "megapixels", 33.0)).
Input:
The user's natural language question is provided below.
`;
};
