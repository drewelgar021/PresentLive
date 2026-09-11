import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { ChatOpenAI } from "@langchain/openai"
import { readFileSync } from "fs";

const AI_BASE_URL = "https://comp2140-3ea651da.uqcloud.net/api/_ai/v1";
const pmdspec = readFileSync("./src/pmdspec.md").toString();

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

const Schema = z.object({ pmd: z.string() })

const model = new ChatOpenAI({
    apiKey: process.env.AI_API_KEY,
    configuration: { baseURL: AI_BASE_URL },
    model: "gpt-4o-mini",
    temperature: 0.7
})

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are an assistant as part of an application that creates presentation slides using a `
      + `markdown format called PresentMD. `
      + `Your job is to generate a markdown presentation deck about the user's provided topic. `
      + `Here is the specification for PresentMD, the markdown presentation format:\n${pmdspec}`
    ],
    [
        "human",
        "Generate a presentation deck in PresentMD about {topic}. "
      + "Return only the markdown."
    ]
])


app.all("/api/generate-presentation", async (request, response) => {
    try {
        const topic = 
            request.method === "GET" ? request.query.topic : request.body?.topic;

        if (!topic || typeof topic !== "string") {
            return response.status(400).json({ error: "Topic is required" });
        }

        const modelWithSchema = model.withStructuredOutput(Schema, {
            name: "pmd",
            strict: true
        });

        const chain = prompt.pipe(modelWithSchema);
        const pmd = await chain.invoke({ topic });

        const parsed = Schema.safeParse(pmd);
        if (!parsed.success) {
            return res.status(502).json({
                error: "Model returned invalid schema.",
                details: parsed.error.flatten()
            });
        }

        return response.json(parsed.data);

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Failed to generate presentation." });
    }
})

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}.`))
