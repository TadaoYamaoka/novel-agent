import { FC } from "react";
import { Accordion, Textarea } from "@mantine/core";

// Define the shape of the system prompt configuration
export type SystemPromptConfig = {
  persona: string;
  goal: string;
};

interface SystemPromptEditorProps {
  config: SystemPromptConfig;
  onChange: (field: keyof SystemPromptConfig, value: string) => void;
}

export const SystemPromptEditor: FC<SystemPromptEditorProps> = ({
  config,
  onChange,
}) => {
  return (
    <Accordion defaultValue="prompt-config" mb="md">
      <Accordion.Item value="prompt-config">
        <Accordion.Control>プロンプト設定</Accordion.Control>
        <Accordion.Panel>
          <Textarea
            label="エージェントペルソナ"
            value={config.persona}
            onChange={(e) => onChange("persona", e.currentTarget.value)}
            autosize
            minRows={2}
            mb="xs"
          />
          <Textarea
            label="エージェント目標"
            value={config.goal}
            onChange={(e) => onChange("goal", e.currentTarget.value)}
            autosize
            minRows={3}
            mb="xs"
          />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
