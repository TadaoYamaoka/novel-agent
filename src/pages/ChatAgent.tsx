import { FC, useCallback, useEffect, useRef, useState } from "react";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import {
  Button,
  Card,
  FileInput,
  Flex,
  Loader,
  PasswordInput,
  ScrollArea,
  Select,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { z } from "zod";
import { ChapterEditor } from "../components/ChapterEditor";
import { CharacterEditor } from "../components/CharacterEditor";
import { SettingsEditor } from "../components/SettingsEditor";
import {
  SystemPromptEditor,
  SystemPromptConfig,
} from "../components/SystemPromptEditor";

/** ________________________________________________
 * Domain‑level types
 * ________________________________________________ */

export type Scene = {
  id: number;
  content: string;
  settingNotes?: string;
  timeElapsed?: string;
  keyEvents?: string[];
  characterNotes?: string;
  foreshadowing?: string;
  payoff?: string;
};

export type Chapter = {
  id: number;
  title: string;
  summary?: string;
  goal?: string;
  scenes: Scene[];
};

export type Character = {
  id: number;
  role: string;
  name: string;
  aliases?: string;
  age?: number | string;
  sex?: string;
  appearance?: string;
  personality?: string;
  abilities?: string;
  backstory?: string;
  motivation?: string;
  goal?: string;
  relationships?: string;
  flaws?: string;
  strengths?: string;
  belonging?: string;
};

export type Settings = {
  theme: string;
  genre: string;
  era?: string;
  stage?: string;
  logline?: string;
  concept?: string;
  worldBuilding?: {
    governance?: string;
    socialStructure?: string;
    economy?: string;
    technologyLevel?: string;
    magicSystem?: string;
    keyLocations?: { name: string; description: string }[];
    keyGroups?: { name: string; description: string }[];
    history?: string;
    rules?: string;
  };
  writingStyle?: {
    pov?: string;
    tense?: string;
    tone?: string;
    targetAudience?: string;
    contentAdvisory?: string;
  };
};

export type Novel = {
  settings: Settings;
  characters: Character[];
  chapters: Chapter[];
};

export type NovelProject = {
  promptConfig: SystemPromptConfig;
  novel: Novel;
};

/** ________________________________________________
 * Chat‑level types
 * ________________________________________________ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentResponse {
  reply: string;
  operations: Operation[];
}

type Operation =
  | {
      type: "update_setting";
      field: keyof Settings;
      value: string;
    }
  | {
      type: "update_world_building_field";
      field: keyof NonNullable<Settings["worldBuilding"]>;
      value: string;
    }
  | {
      type: "update_writing_style_field";
      field: keyof NonNullable<Settings["writingStyle"]>;
      value: string;
    }
  | {
      type: "update_character_field";
      index: number;
      field: keyof Character;
      value: string | number;
    }
  | {
      type: "add_character";
      character: Character;
    }
  | {
      type: "add_chapter";
      chapter: Chapter;
    }
  | {
      type: "add_scene";
      chapterIndex: number; // 0-based
      scene: Scene;
    }
  | {
      type: "update_scene_content";
      chapterIndex: number;
      sceneIndex: number;
      field: keyof Scene;
      value: string;
    }
  | {
      type: "update_chapter_field";
      chapterIndex: number;
      field: keyof Chapter;
      value: string;
    }
  | {
      type: "update_scene_field";
      chapterIndex: number;
      sceneIndex: number;
      field: keyof Scene;
      value: string | string[];
    };

/** ________________________________________________
 * Utility to apply operations to novel state.
 * ________________________________________________ */

function applyOperations(prev: Novel, ops: Operation[]): Novel {
  const novel = structuredClone(prev);
  ops.forEach((op) => {
    switch (op.type) {
      case "update_setting":
        // Ensure field exists on settings before assignment
        if (op.field in novel.settings) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (novel.settings as any)[op.field] = op.value;
        }
        break;
      case "update_world_building_field": {
        if (!novel.settings.worldBuilding) {
          novel.settings.worldBuilding = {};
        }
        // Handle array fields specifically
        if (
          (op.field === "keyLocations" || op.field === "keyGroups") &&
          typeof op.value === "string"
        ) {
          const items = op.value
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.includes(":"))
            .map((line) => {
              const parts = line.split(":");
              const name = parts[0].trim();
              const description = parts.slice(1).join(":").trim();
              return { name, description };
            });
          novel.settings.worldBuilding[op.field] = items;
        } else {
          // Handle simple string fields
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (novel.settings.worldBuilding as any)[op.field] = op.value;
        }
        break;
      }
      case "update_writing_style_field": {
        if (!novel.settings.writingStyle) {
          novel.settings.writingStyle = {}; // Initialize if it doesn't exist
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (novel.settings.writingStyle as any)[op.field] = op.value;
        break;
      }
      case "update_character_field": {
        const c = novel.characters[op.index];
        if (c) {
          // Attempt conversion if field is 'age' and value is a number string
          if (op.field === "age") {
            const num = Number(op.value);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c as any)[op.field] = isNaN(num) ? op.value : num;
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c as any)[op.field] = op.value;
          }
        }
        break;
      }
      case "add_character":
        novel.characters.push(op.character);
        break;
      case "add_chapter":
        novel.chapters.push(op.chapter);
        break;
      case "add_scene": {
        const chap = novel.chapters[op.chapterIndex];
        if (chap) chap.scenes.push(op.scene);
        break;
      }
      case "update_scene_content": {
        const scene = novel.chapters[op.chapterIndex]?.scenes[op.sceneIndex];
        if (scene) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (scene as any)[op.field] = op.value;
        }
        break;
      }
      case "update_chapter_field": {
        const chap = novel.chapters[op.chapterIndex];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (chap) (chap as any)[op.field] = op.value;
        break;
      }
      case "update_scene_field": {
        const scene = novel.chapters[op.chapterIndex]?.scenes[op.sceneIndex];
        if (scene) {
          // Handle keyEvents specifically: split string into array
          if (op.field === "keyEvents" && typeof op.value === "string") {
            scene.keyEvents = op.value.split("\n").filter((s) => s.trim());
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (scene as any)[op.field] = op.value;
          }
        }
        break;
      }
      default:
        break;
    }
  });
  return novel;
}

/** ________________________________________________
 * Helper to safely extract JSON payload from model output.
 * ________________________________________________ */

function extractJson(raw: string): string | null {
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

/** ________________________________________________
 * Zod schema for AgentResponse
 * ________________________________________________ */

const settingsFields = z
  .enum(["theme", "genre", "era", "stage", "logline", "concept"])
  .describe("Updatable setting fields");

const characterFields = z
  .enum([
    "role",
    "name",
    "aliases",
    "age",
    "sex",
    "appearance",
    "personality",
    "abilities",
    "backstory",
    "motivation",
    "goal",
    "relationships",
    "flaws",
    "strengths",
    "belonging",
  ])
  .describe("Updatable character attributes");
const sceneFields = z.enum(["content"]).describe("Updatable scene attributes");

const worldBuildingFields = z
  .enum([
    "governance",
    "socialStructure",
    "economy",
    "technologyLevel",
    "magicSystem",
    "keyLocations", // Note: Handling complex types like arrays/objects might need more logic
    "keyGroups", // Note: Handling complex types like arrays/objects might need more logic
    "history",
    "rules",
  ])
  .describe("Updatable world building fields");

const writingStyleFields = z
  .enum(["pov", "tense", "tone", "targetAudience", "contentAdvisory"])
  .describe("Updatable writing style fields");

const updateSettingOpSchema = z
  .object({
    type: z
      .literal("update_setting")
      .describe("Operation type: Update setting"),
    field: settingsFields.describe("Name of the setting field to update"),
    value: z.string().describe("New value for the setting field"),
  })
  .describe("Operation to update a novel setting field");

const updateWorldBuildingFieldOpSchema = z
  .object({
    type: z
      .literal("update_world_building_field")
      .describe("Operation type: Update world building attribute"),
    field: worldBuildingFields.describe(
      "Name of the world building attribute to update"
    ),
    value: z.string().describe("New value for the world building attribute"),
  })
  .describe("Operation to update a specific attribute of the world building");

const updateWritingStyleFieldOpSchema = z
  .object({
    type: z
      .literal("update_writing_style_field")
      .describe("Operation type: Update writing style attribute"),
    field: writingStyleFields.describe(
      "Name of the writing style attribute to update"
    ),
    value: z.string().describe("New value for the writing style attribute"),
  })
  .describe("Operation to update a specific attribute of the writing style");

const updateCharacterFieldOpSchema = z
  .object({
    type: z
      .literal("update_character_field")
      .describe("Operation type: Update character attribute"),
    index: z
      .number()
      .int()
      .describe("0-based index of the character to update"),
    field: characterFields.describe(
      "Name of the character attribute to update"
    ),
    value: z.string().describe("New value for the character attribute"),
  })
  .describe(
    "Operation to update a specific attribute of an existing character"
  );

const characterSchema = z
  .object({
    id: z.number().int().describe("Unique identifier for the character"),
    role: z
      .string()
      .describe(
        "Role of the character in the story (e.g., 主人公, ヒロイン, 敵役)"
      ),
    name: z.string().describe("Full name of the character"),
    aliases: z
      .string()
      .optional()
      .describe("Nicknames, titles, or other names the character goes by"),
    age: z
      .string()
      .describe(
        "Age of the character (can be a number or descriptive string like '青年期')"
      ),
    sex: z.string().optional().describe("Gender or sex of the character"),
    appearance: z
      .string()
      .optional()
      .describe("Physical appearance description"),
    personality: z
      .string()
      .optional()
      .describe("Personality traits and temperament"),
    abilities: z
      .string()
      .optional()
      .describe("Special skills, powers, or abilities"),
    backstory: z
      .string()
      .optional()
      .describe("Background history of the character"),
    motivation: z
      .string()
      .optional()
      .describe("What drives the character's actions"),
    goal: z
      .string()
      .optional()
      .describe("The character's primary objective or desire"),
    relationships: z
      .string()
      .optional()
      .describe(
        "Description of relationships with other characters (free text)"
      ),
    flaws: z.string().optional().describe("Weaknesses or negative traits"),
    strengths: z.string().optional().describe("Strengths or positive traits"),
    belonging: z
      .string()
      .optional()
      .describe("Group, organization, or place the character belongs to"),
  })
  .describe("Detailed information of the character");

const addCharacterOpSchema = z
  .object({
    type: z.literal("add_character").describe("Operation type: Add character"),
    character: characterSchema.describe(
      "Detailed information of the character to add"
    ),
  })
  .describe("Operation to add a new character to the novel");

const sceneSchema = z.object({
  id: z.number().int(),
  content: z.string(),
  settingNotes: z.string(),
  timeElapsed: z.string(),
  keyEvents: z.array(z.string()),
  characterNotes: z.string(),
  foreshadowing: z.string(),
  payoff: z.string(),
});

const chapterSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  summary: z.string(),
  goal: z.string(),
  scenes: z.array(sceneSchema),
});

const addChapterOpSchema = z
  .object({
    type: z.literal("add_chapter").describe("Operation type: Add chapter"),
    chapter: chapterSchema.describe(
      "Detailed information of the chapter to add"
    ),
  })
  .describe("Operation to add a new chapter to the novel");

const addSceneOpSchema = z
  .object({
    type: z.literal("add_scene").describe("Operation type: Add scene"),
    chapterIndex: z
      .number()
      .int()
      .describe("0-based index of the chapter to add the scene to"),
    scene: sceneSchema.describe("Detailed information of the scene to add"),
  })
  .describe("Operation to add a new scene to an existing chapter");

const updateSceneContentOpSchema = z
  .object({
    type: z
      .literal("update_scene_content")
      .describe("Operation type: Update scene content"),
    chapterIndex: z
      .number()
      .int()
      .describe("0-based index of the chapter containing the scene to update"),
    sceneIndex: z
      .number()
      .int()
      .describe("0-based index of the scene to update"),
    field: sceneFields.describe(
      "Name of the scene attribute to update (currently only 'content')"
    ),
    value: z.string().describe("New value for the scene content"),
  })
  .describe("Operation to update the content of an existing scene");

const updateChapterFieldOpSchema = z.object({
  type: z.literal("update_chapter_field"),
  chapterIndex: z.number().int(),
  field: z.enum(["id", "title", "summary", "goal"]),
  value: z.string(),
});

const updateSceneFieldOpSchema = z.object({
  type: z.literal("update_scene_field"),
  chapterIndex: z.number().int(),
  sceneIndex: z.number().int(),
  field: z.enum([
    "id",
    "content",
    "settingNotes",
    "timeElapsed",
    "keyEvents",
    "characterNotes",
    "foreshadowing",
    "payoff",
  ]),
  value: z.string(),
});

// Revert to union to avoid invalid "not" constraints in JSON Schema
// Change z.union to z.discriminatedUnion
const operationSchema = z
  .discriminatedUnion("type", [
    // Use discriminatedUnion based on the 'type' field
    updateSettingOpSchema,
    updateWorldBuildingFieldOpSchema,
    updateWritingStyleFieldOpSchema,
    updateCharacterFieldOpSchema,
    addCharacterOpSchema,
    addChapterOpSchema,
    addSceneOpSchema,
    updateSceneContentOpSchema,
    updateChapterFieldOpSchema,
    updateSceneFieldOpSchema,
  ])
  .describe("One of the possible operation objects to modify the novel state");

const agentResponseSchema = z
  .object({
    reply: z.string().describe("Reply message to the user (in Japanese)"),
    operations: z
      .array(operationSchema)
      .describe("List of operations to execute (empty array if no changes)"),
  })
  .describe("Overall structure of the JSON response generated by the agent");

/** ________________________________________________
 * ChatAgent component
 * ________________________________________________ */

// Default prompt configuration
const defaultSystemPromptConfig: SystemPromptConfig = {
  persona: "あなたは小説の共同執筆エージェントです。",
  goal: "ユーザーの指示を理解し、現在のプロジェクト状態を更新しながら魅力的な物語コンテンツを生成してください。",
};

export const ChatAgent: FC = () => {
  // LocalStorage-backed initial state for provider and models
  const [apiProvider, setApiProvider] = useState<"ollama" | "openai">(() => {
    const stored = localStorage.getItem("apiProvider");
    return stored === "openai" ? "openai" : "ollama";
  });
  const [openaiModelName, setOpenaiModelName] = useState<string>(() => {
    return localStorage.getItem("openaiModelName") || "gpt-4o";
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem("selectedModel") || "";
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // State for the novel content itself
  const [novel, setNovel] = useState<Novel>({
    settings: {
      theme: "AIによる管理社会と人間の自由",
      genre: "SF・ディストピア・サスペンス",
      era: "近未来（西暦2093年）",
      stage: "メガシティ・ネオトウキョウ",
      worldBuilding: {
        rules:
          "市民は全てAIによって監視・管理され、自由意志を持つことが許されない。人間の意思決定は『ガイダンスAI』によって最適化される。",
      },
    },
    characters: [
      {
        id: 1,
        role: "主人公",
        name: "天城 レン",
        age: 24,
        sex: "男",
        appearance: "黒髪の短髪、鋭い目つき、細身の体型",
        personality: "冷静沈着だが、内心は自由を求める強い意志を持つ",
        abilities: "高度なハッキングスキルと電子機器の扱いに長けている",
      },
      {
        id: 2,
        role: "ヒロイン",
        name: "ユナ・アンドロイド No.107",
        age: 20,
        sex: "女",
        appearance: "銀髪に琥珀色の瞳、アンドロイドらしからぬ表情豊かな顔",
        personality: "好奇心旺盛で、感情を持つことに興味を抱いている",
        abilities: "高度な分析能力と戦闘スキルを搭載",
      },
    ],
    chapters: [],
  });
  // Separate state for system prompt configuration
  const [systemPromptConfig, setSystemPromptConfig] =
    useState<SystemPromptConfig>(defaultSystemPromptConfig);

  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false); // Default to false initially
  const fileInputRef = useRef<HTMLButtonElement>(null);

  // Fetch available Ollama models on mount or when provider changes to ollama
  useEffect(() => {
    const fetchModels = async () => {
      if (apiProvider !== "ollama") {
        setAvailableModels([]);
        setSelectedModel("");
        setModelsLoading(false);
        return;
      }
      setModelsLoading(true);
      setAvailableModels([]); // Clear previous models
      setSelectedModel(""); // Clear selection
      try {
        const response = await fetch("http://localhost:11434/api/tags");
        if (!response.ok) {
          // Don't throw error, just log and continue, maybe Ollama isn't running
          console.warn(`Ollama fetch failed: ${response.status}`);
          setAvailableModels([]);
          setSelectedModel("");
          // throw new Error(`HTTP error! status: ${response.status}`);
        } else {
          const data = await response.json();
          const modelNames = data.models.map((m: { name: string }) => m.name);
          setAvailableModels(modelNames);
          if (modelNames.length > 0) {
            setSelectedModel(modelNames[0]); // Set default to the first fetched model
          } else {
            console.warn("No Ollama models found.");
            setSelectedModel("");
          }
        }
      } catch (error) {
        console.error("Failed to fetch Ollama models:", error);
        setAvailableModels([]); // Clear models on error
        setSelectedModel("");
        // Optionally, show an error message to the user
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [apiProvider]); // Run when apiProvider changes

  // Persist provider and model selections to LocalStorage
  useEffect(() => {
    localStorage.setItem("apiProvider", apiProvider);
  }, [apiProvider]);

  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem("openaiModelName", openaiModelName);
  }, [openaiModelName]);

  // Removed useEffect for ollamaRef update

  // --- Handlers for UI edits ---
  const handleSettingChange = useCallback(
    (field: keyof Settings, value: string) => {
      setNovel((prev) => ({
        ...prev,
        settings: { ...prev.settings, [field]: value },
      }));
    },
    []
  );

  const handleWorldBuildingChange = useCallback(
    (field: keyof NonNullable<Settings["worldBuilding"]>, value: string) => {
      setNovel((prev) => {
        let updatedValue: string | { name: string; description: string }[] =
          value;

        // Parse string into array for specific fields
        if (field === "keyLocations" || field === "keyGroups") {
          updatedValue = value
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.includes(":"))
            .map((line) => {
              const parts = line.split(":");
              const name = parts[0].trim();
              const description = parts.slice(1).join(":").trim();
              return { name, description };
            });
        }

        return {
          ...prev,
          settings: {
            ...prev.settings,
            worldBuilding: {
              ...(prev.settings.worldBuilding || {}),
              [field]: updatedValue, // Use the potentially parsed value
            },
          },
        };
      });
    },
    []
  );

  const handleWritingStyleChange = useCallback(
    (field: keyof NonNullable<Settings["writingStyle"]>, value: string) => {
      setNovel((prev) => ({
        ...prev, // Spread the previous novel state
        settings: {
          ...prev.settings, // Spread the previous settings
          writingStyle: {
            ...(prev.settings.writingStyle || {}), // Spread the previous writingStyle
            [field]: value, // Apply the specific change
          },
        },
      }));
    },
    []
  );

  // New handler for system prompt changes
  const handleSystemPromptChange = useCallback(
    (field: keyof SystemPromptConfig, value: string) => {
      setSystemPromptConfig((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleCharacterChange = useCallback(
    (index: number, field: keyof Character, value: string | number) => {
      setNovel((prev) => {
        const updatedCharacters = [...prev.characters];
        if (updatedCharacters[index]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (updatedCharacters[index] as any)[field] = value;
        }
        return { ...prev, characters: updatedCharacters };
      });
    },
    []
  );

  const handleChapterChange = useCallback(
    (chapterIndex: number, field: keyof Chapter, value: string) => {
      setNovel((prev) => {
        const updatedChapters = [...prev.chapters];
        if (updatedChapters[chapterIndex]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (updatedChapters[chapterIndex] as any)[field] = value;
        }
        return { ...prev, chapters: updatedChapters };
      });
    },
    []
  );

  const handleSceneChange = useCallback(
    (
      chapterIndex: number,
      sceneIndex: number,
      field: keyof Scene,
      value: string
    ) => {
      setNovel((prev) => {
        const updatedChapters = [...prev.chapters];
        const chapter = updatedChapters[chapterIndex];
        if (chapter && chapter.scenes[sceneIndex]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (chapter.scenes[sceneIndex] as any)[field] = value;
        }
        return { ...prev, chapters: updatedChapters };
      });
    },
    []
  );

  // --- Import/Export Handlers ---
  const handleExport = useCallback(() => {
    // Create the project structure including prompt config and novel data
    const projectData: NovelProject = {
      promptConfig: systemPromptConfig,
      novel: novel,
    };
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "novel-project.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [novel, systemPromptConfig]); // Add systemPromptConfig dependency

  // Add Markdown export handler
  const handleExportMarkdown = useCallback(() => {
    // 小説の章・シーンを Markdown に変換
    const md = novel.chapters
      .map(
        (ch) =>
          `# Chapter ${ch.id}: ${ch.title}\n\n` +
          ch.scenes
            .map((sc) => `## Scene ${sc.id}\n\n${sc.content}`)
            .join("\n\n")
      )
      .join("\n\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "novel.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [novel]);

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importedProject = JSON.parse(jsonString);

        // Validate the imported structure
        if (
          importedProject &&
          typeof importedProject === "object" &&
          // Check for the current structure (has promptConfig)
          "promptConfig" in importedProject &&
          "novel" in importedProject &&
          "settings" in importedProject.novel &&
          "characters" in importedProject.novel &&
          "chapters" in importedProject.novel &&
          typeof importedProject.promptConfig.persona === "string" &&
          typeof importedProject.promptConfig.goal === "string"
        ) {
          // Load data from the current structure
          setSystemPromptConfig(
            importedProject.promptConfig as SystemPromptConfig
          );
          setNovel(importedProject.novel as Novel);
          setMessages([]);
          alert("プロジェクトをインポートしました。");
        } else {
          throw new Error("Invalid or unrecognized project file structure.");
        }
      } catch (error) {
        console.error("Failed to import project:", error);
        alert(
          `ファイルのインポートに失敗しました。\nError: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("ファイルの読み込みに失敗しました。");
    };
    reader.readAsText(file);
  }, []); // No dependencies needed for setNovel/setMessages

  // --- End Handlers ---

  const sendMessage = useCallback(async () => {
    const currentInput = input.trim();
    let chatModel: ChatOllama | ChatOpenAI | null = null;

    // Determine which model to use and if it's configured
    if (apiProvider === "ollama") {
      if (!selectedModel) {
        alert("Ollamaモデルを選択してください。");
        return;
      }
      chatModel = new ChatOllama({ model: selectedModel });
    } else if (apiProvider === "openai") {
      if (!openaiApiKey) {
        alert("OpenAI APIキーを入力してください。");
        return;
      }
      if (!openaiModelName.trim()) {
        alert("OpenAIモデル名を入力してください。");
        return;
      }
      chatModel = new ChatOpenAI({
        apiKey: openaiApiKey,
        modelName: openaiModelName.trim(),
      });
    }

    if (!currentInput || !chatModel) return;

    setMessages((prev) => [...prev, { role: "user", content: currentInput }]);
    setInput("");
    setLoading(true);

    // --- Dynamically construct the system prompt using systemPromptConfig state ---
    const { persona, goal } = systemPromptConfig;
    const dynamicSystemPrompt = `${persona}

# Goal
${goal}

# Output Format
必ず JSON 形式のみを出力してください。構造は以下です。
\`\`\`json
{
  "reply": "ユーザーに返す日本語メッセージ。具体的な内容はoperationsに出力するため、概要を出力。",
  "operations": [ /* 状態を変更する命令。不要なら [] */ ]
}
\`\`\`

# Permitted operation objects
- update_setting: { "type": "update_setting", "field": "theme|genre|era|stage|logline|concept", "value": "..." }
- update_world_building_field: { "type": "update_world_building_field", "field": "governance|socialStructure|economy|technologyLevel|magicSystem|keyLocations|keyGroups|history|rules", "value": "..." }
- update_writing_style_field: { "type": "update_writing_style_field", "field": "pov|tense|tone|targetAudience|contentAdvisory", "value": "..." } // Add definition for writing style
- update_character_field: { "type": "update_character_field", "index": 0-based, "field": "role|name|aliases|age|sex|appearance|personality|abilities|backstory|motivation|goal|relationships|flaws|strengths|belonging", "value": "..." }
- add_character: { "type": "add_character", "character": { "id": number, "role": string, "name": string, "age": string, "sex": string, "appearance": string, "personality": string, "abilities": string, "backstory": string, "motivation": string, "goal": string, "relationships": string, "flaws": string, "strengths": string, "belonging": string } }
- add_chapter: { "type": "add_chapter", "chapter": { "id": number, "title": string, "scenes": { "id": number, "content": string }[] }
- add_scene: { "type": "add_scene", "chapterIndex": 0-based, "scene": { "id": number, "content": string } }

# Strict rules
- JSON 以外を絶対に出力しないこと。
- "reply" の改行は \\n でエスケープ。
- <think></think> タグ内で自由に思考して良いが、タグの外には JSON のみを出力すること。
- **"operations" 配列には、必ず # Permitted operation objects で定義された type のオブジェクトのみを含めること。それ以外の type を持つオブジェクトは絶対に使用しないこと。**
- **ユーザーが「第X章」「Y番目のキャラクター」「Z番目のシーン」のように1から始まる番号で指示した場合でも、JSON内の \`index\` や \`chapterIndex\`, \`sceneIndex\` は必ず0から始まる番号に変換して出力すること。例えば、ユーザーが「第1章のシーン3」について言及した場合、\`chapterIndex\` は \`0\`、\`sceneIndex\` は \`2\` となります。**`;
    // --- End dynamic system prompt construction ---

    const chatHistory = [new SystemMessage(dynamicSystemPrompt)];
    const MAX_HISTORY = 8;
    const sliced = messages.slice(-MAX_HISTORY);
    sliced.forEach((m) => {
      if (m.role === "user") chatHistory.push(new HumanMessage(m.content));
      else chatHistory.push(new AIMessage(m.content));
    });

    chatHistory.push(
      new HumanMessage(
        // Send only the novel data (settings, characters, chapters) as context
        `${currentInput}\n\n# 現在の小説状態\n${JSON.stringify(
          novel, // Pass the novel state object directly
          null,
          2
        )}`
      )
    );

    try {
      let parsed: AgentResponse;

      if (apiProvider === "openai" && chatModel instanceof ChatOpenAI) {
        // Use withStructuredOutput for OpenAI with the FULL schema
        const structuredChatModel = chatModel.withStructuredOutput(
          agentResponseSchema // Use the full schema here
        );
        // Invoke should now return the fully parsed and validated object
        parsed = await structuredChatModel.invoke(chatHistory);
      } else if (apiProvider === "ollama" && chatModel instanceof ChatOllama) {
        // Use streaming and manual parsing for Ollama
        let rawResponse = "";
        for await (const chunk of await chatModel.stream(chatHistory)) {
          rawResponse += chunk.content;
        }
        const jsonStr = extractJson(rawResponse);
        if (!jsonStr)
          throw new Error("JSON payload not found in Ollama response");
        parsed = JSON.parse(jsonStr);
        // Optional: Validate Ollama response against schema if desired
        // parsed = agentResponseSchema.parse(JSON.parse(jsonStr));
      } else {
        throw new Error("Invalid API provider or model instance.");
      }

      // Apply operations and update state (common logic)
      if (parsed.operations?.length) {
        setNovel((prev) => applyOperations(prev, parsed.operations));
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: parsed.reply },
      ]);
    } catch (err) {
      console.error(err);
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error occurred";
      // Check if it's a Zod validation error
      if (err instanceof z.ZodError) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ モデルの応答形式が無効です:\n${err.errors
              .map((e) => `${e.path.join(".")} - ${e.message}`)
              .join("\n")}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ 返答の処理中にエラーが発生しました: ${errorMsg}`,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [
    input,
    messages,
    novel, // novel state is still needed for context and applying operations
    systemPromptConfig, // Add systemPromptConfig as dependency
    apiProvider,
    selectedModel,
    openaiApiKey,
    openaiModelName,
  ]);

  // --- Keyboard shortcut handler ---
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isReadyToSend =
        !loading &&
        input.trim() &&
        (apiProvider === "ollama"
          ? !!selectedModel
          : !!openaiApiKey && !!openaiModelName.trim());

      if (
        (event.ctrlKey || event.metaKey) && // Check for Ctrl or Command key
        event.key === "Enter" &&
        isReadyToSend
      ) {
        event.preventDefault(); // Prevent default Enter behavior (newline)
        sendMessage();
      }
    },
    [
      sendMessage,
      loading,
      input,
      apiProvider,
      selectedModel,
      openaiApiKey,
      openaiModelName,
    ] // Added dependencies
  );

  const renderBubble = (m: ChatMessage, idx: number) => (
    <Flex
      key={idx}
      align={m.role === "user" ? "flex-end" : "flex-start"}
      bg={m.role === "user" ? "blue.6" : "gray.7"}
      c="white"
    >
      <Text size="sm">{m.content}</Text>
    </Flex>
  );

  const isSendDisabled =
    loading ||
    !input.trim() ||
    (apiProvider === "ollama" && (!selectedModel || modelsLoading)) ||
    (apiProvider === "openai" && (!openaiApiKey || !openaiModelName)); // Check if openaiModelName is selected

  const isInputDisabled =
    loading ||
    (apiProvider === "ollama" && (!selectedModel || modelsLoading)) ||
    (apiProvider === "openai" && (!openaiApiKey || !openaiModelName)); // Check if openaiModelName is selected

  const inputPlaceholder =
    apiProvider === "ollama"
      ? modelsLoading
        ? "Ollamaモデルを読み込み中..."
        : !selectedModel
        ? "Ollamaモデルを選択してください"
        : "メッセージを入力..."
      : !openaiApiKey
      ? "OpenAI APIキーを入力してください"
      : !openaiModelName // Check if openaiModelName is selected
      ? "OpenAIモデルを選択してください"
      : "メッセージを入力...";

  return (
    <Flex direction="row" gap="md" p="md" w="100%" h="100vh" bg="dark.8">
      <Flex direction="column" w="60%" h="100%">
        {/* Header Flex container */}
        <Flex justify="space-between" align="center" mb="xs" gap="xs">
          <Title order={2} c="gray.2">
            Novel Agent
          </Title>
          <Flex gap="md">
            {/* API Provider Selection */}
            <Select
              data={[
                { value: "ollama", label: "Ollama" },
                { value: "openai", label: "OpenAI" },
              ]}
              value={apiProvider}
              onChange={(value) => setApiProvider(value as "ollama" | "openai")}
              disabled={loading}
              allowDeselect={false}
              w={120}
            />
            {/* Conditional Model Selection/Input */}
            {apiProvider === "ollama" ? (
              <Select
                placeholder={
                  modelsLoading ? "Loading models..." : "Choose Ollama model"
                }
                data={availableModels}
                value={selectedModel}
                onChange={(value) => setSelectedModel(value || "")}
                disabled={
                  loading || modelsLoading || availableModels.length === 0
                }
                allowDeselect={false}
                w={200}
                searchable
              />
            ) : (
              // Replace TextInput with Select for OpenAI models
              <Select
                placeholder="Choose OpenAI model"
                data={["gpt-4o", "gpt-4.1", "o4-mini"]} // Added model options
                value={openaiModelName}
                onChange={(value) => setOpenaiModelName(value || "")} // Handle null case if allowDeselect were true
                disabled={loading}
                allowDeselect={false} // Ensure a model is always selected
                w={200}
              />
            )}
          </Flex>
        </Flex>
        {/* OpenAI API Key Input */}
        {apiProvider === "openai" && (
          <PasswordInput
            placeholder="Enter OpenAI API Key"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.currentTarget.value)}
            disabled={loading}
            mb="xs" // Add some margin below the key input
          />
        )}
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Flex direction="column" gap="xs" p="xs">
            {messages.map(renderBubble)}
            {loading && (
              <Flex align="flex-start">
                <Loader size="sm" />
              </Flex>
            )}
          </Flex>
        </ScrollArea>
        {/* Input Area */}
        <Flex mt="xs" gap="xs">
          <Textarea
            placeholder={inputPlaceholder} // Updated placeholder logic handles model selection
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={handleKeyDown} // Add keydown handler
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
            disabled={isInputDisabled} // Updated disabled logic
          />
          <Button
            onClick={sendMessage}
            disabled={isSendDisabled} // Updated disabled logic
            w={100}
          >
            {loading ? <Loader color="white" size="sm" /> : "送信"}
          </Button>
        </Flex>
      </Flex>
      <Card shadow="sm" p="md" pr="sm" radius="md" withBorder w="40%">
        {/* Card Header with Title and Buttons */}
        <Flex justify="space-between" align="center" mb="md">
          <Title order={3}>現在のプロジェクト</Title>
          <Flex align="center" gap="xs">
            {/* Added Import/Export buttons and FileInput here */}
            <FileInput
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/json"
              style={{ display: "none" }} // Hide the default FileInput UI
            />
            <Button
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Import
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleExport}
              disabled={loading}
            >
              Export
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleExportMarkdown}
              disabled={loading}
            >
              Markdown
            </Button>
          </Flex>
        </Flex>
        <ScrollArea h="calc(100vh - 100px)" offsetScrollbars>
          {" "}
          {/* Adjust height as needed */}
          {/* Render the new SystemPromptEditor */}
          <SystemPromptEditor
            config={systemPromptConfig}
            onChange={handleSystemPromptChange}
          />
          {/* Render existing editors */}
          <SettingsEditor
            settings={novel.settings}
            onChange={handleSettingChange}
            onWorldBuildingChange={handleWorldBuildingChange}
            onWritingStyleChange={handleWritingStyleChange}
          />
          <CharacterEditor
            characters={novel.characters}
            onChange={handleCharacterChange}
          />
          <ChapterEditor
            chapters={novel.chapters}
            onChapterChange={handleChapterChange}
            onSceneChange={handleSceneChange}
          />
        </ScrollArea>
      </Card>
    </Flex>
  );
};
