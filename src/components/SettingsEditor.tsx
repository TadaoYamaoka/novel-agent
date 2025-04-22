import { FC } from "react";
import {
  Accordion,
  TextInput,
  Stack,
  Title,
  Textarea,
  Box,
  Flex, // Import Flex
  Button, // Import Button
} from "@mantine/core"; // Added Box
import { Settings } from "../pages/ChatAgent"; // Adjust import path if needed

interface SettingsEditorProps {
  settings: Settings;
  onChange: (field: keyof Settings, value: string) => void;
  onWorldBuildingChange: (
    field: keyof NonNullable<Settings["worldBuilding"]>,
    value: string // Pass string value for consistency
  ) => void;
  onWritingStyleChange: (
    field: keyof NonNullable<Settings["writingStyle"]>,
    value: string
  ) => void;
  handleClearSettings: () => void; // Add handler prop
  loading: boolean; // Add loading prop
}

// Helper to format array fields for Textarea
const formatArrayField = (
  items: { name: string; description: string }[] | undefined
): string => {
  return (
    items?.map((item) => `${item.name}: ${item.description}`).join("\n") || ""
  );
};

export const SettingsEditor: FC<SettingsEditorProps> = ({
  settings,
  onChange,
  onWorldBuildingChange,
  onWritingStyleChange,
  handleClearSettings, // Destructure handler
  loading, // Destructure loading state
}) => {
  return (
    <Box mb="md">
      {" "}
      {/* Add margin bottom */}
      {/* 基本設定 Fields (outside Accordion) */}
      {/* Wrap Title and Button in Flex */}
      <Flex justify="space-between" align="center" mb="xs">
        <Title order={5}>基本設定</Title>
        <Button
          variant="outline"
          color="gray"
          size="xs"
          onClick={handleClearSettings}
          disabled={loading}
        >
          Clear Settings
        </Button>
      </Flex>
      <Stack gap="xs" mb="md">
        {" "}
        {/* Wrap fields in Stack */}
        <TextInput
          label="テーマ"
          value={settings.theme}
          onChange={(e) => onChange("theme", e.currentTarget.value)}
        />
        <TextInput
          label="ジャンル"
          value={settings.genre}
          onChange={(e) => onChange("genre", e.currentTarget.value)}
        />
        <TextInput
          label="時代"
          value={settings.era || ""} // Handle potential undefined
          onChange={(e) => onChange("era", e.currentTarget.value)}
        />
        <TextInput
          label="舞台"
          value={settings.stage || ""} // Handle potential undefined
          onChange={(e) => onChange("stage", e.currentTarget.value)}
        />
        <TextInput
          label="ログライン"
          value={settings.logline || ""}
          onChange={(e) => onChange("logline", e.currentTarget.value)}
        />
        <TextInput
          label="作品コンセプト"
          value={settings.concept || ""}
          onChange={(e) => onChange("concept", e.currentTarget.value)}
        />
      </Stack>
      {/* Accordion for other sections */}
      <Accordion multiple defaultValue={["settings-worldbuilding"]}>
        {" "}
        {/* Adjust defaultValue if needed */}
        {/* 世界観設定 Accordion Item */}
        <Accordion.Item value="settings-worldbuilding">
          <Accordion.Control>
            <Title order={5}>世界観設定</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs" mt="xs">
              {" "}
              {/* Add top margin */}
              <TextInput
                label="統治体制"
                value={settings.worldBuilding?.governance || ""}
                onChange={(e) =>
                  onWorldBuildingChange("governance", e.currentTarget.value)
                }
              />
              <TextInput
                label="社会構造"
                value={settings.worldBuilding?.socialStructure || ""}
                onChange={(e) =>
                  onWorldBuildingChange(
                    "socialStructure",
                    e.currentTarget.value
                  )
                }
              />
              <TextInput
                label="経済システム"
                value={settings.worldBuilding?.economy || ""}
                onChange={(e) =>
                  onWorldBuildingChange("economy", e.currentTarget.value)
                }
              />
              <TextInput
                label="技術レベル"
                value={settings.worldBuilding?.technologyLevel || ""}
                onChange={(e) =>
                  onWorldBuildingChange(
                    "technologyLevel",
                    e.currentTarget.value
                  )
                }
              />
              <TextInput
                label="魔法体系"
                value={settings.worldBuilding?.magicSystem || ""}
                onChange={(e) =>
                  onWorldBuildingChange("magicSystem", e.currentTarget.value)
                }
              />
              {/* Add Textarea for keyLocations */}
              <Textarea
                label="主要な場所 (名前: 説明 の形式で改行区切り)"
                value={formatArrayField(settings.worldBuilding?.keyLocations)}
                onChange={(e) =>
                  onWorldBuildingChange("keyLocations", e.currentTarget.value)
                }
                autosize
                minRows={2}
              />
              {/* Add Textarea for keyGroups */}
              <Textarea
                label="主要な組織・グループ (名前: 説明 の形式で改行区切り)"
                value={formatArrayField(settings.worldBuilding?.keyGroups)}
                onChange={(e) =>
                  onWorldBuildingChange("keyGroups", e.currentTarget.value)
                }
                autosize
                minRows={2}
              />
              <TextInput
                label="歴史・背景"
                value={settings.worldBuilding?.history || ""}
                onChange={(e) =>
                  onWorldBuildingChange("history", e.currentTarget.value)
                }
              />
              <TextInput
                label="世界のルール"
                value={settings.worldBuilding?.rules || ""}
                onChange={(e) =>
                  onWorldBuildingChange("rules", e.currentTarget.value)
                }
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
        {/* 文体・視点設定 Accordion Item */}
        <Accordion.Item value="settings-writingstyle">
          <Accordion.Control>
            <Title order={5}>文体・視点設定</Title>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="xs" mt="xs">
              {" "}
              {/* Add top margin */}
              <TextInput
                label="視点"
                value={settings.writingStyle?.pov || ""}
                onChange={(e) =>
                  onWritingStyleChange("pov", e.currentTarget.value)
                }
              />
              <TextInput
                label="時制"
                value={settings.writingStyle?.tense || ""}
                onChange={(e) =>
                  onWritingStyleChange("tense", e.currentTarget.value)
                }
              />
              <TextInput
                label="トーン"
                value={settings.writingStyle?.tone || ""}
                onChange={(e) =>
                  onWritingStyleChange("tone", e.currentTarget.value)
                }
              />
              <TextInput
                label="想定読者層"
                value={settings.writingStyle?.targetAudience || ""}
                onChange={(e) =>
                  onWritingStyleChange("targetAudience", e.currentTarget.value)
                }
              />
              <TextInput
                label="内容注意書き"
                value={settings.writingStyle?.contentAdvisory || ""}
                onChange={(e) =>
                  onWritingStyleChange("contentAdvisory", e.currentTarget.value)
                }
              />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
};
