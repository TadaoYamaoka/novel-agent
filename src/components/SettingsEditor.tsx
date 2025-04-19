import { FC } from "react";
import { Accordion, Textarea, TextInput } from "@mantine/core";
import { Settings } from "../pages/ChatAgent"; // Adjust import path if needed

interface SettingsEditorProps {
  settings: Settings;
  onChange: (field: keyof Settings, value: string) => void;
}

export const SettingsEditor: FC<SettingsEditorProps> = ({
  settings,
  onChange,
}) => {
  return (
    <Accordion defaultValue="settings">
      <Accordion.Item value="settings">
        <Accordion.Control>設定</Accordion.Control>
        <Accordion.Panel>
          <TextInput
            label="テーマ"
            value={settings.theme}
            onChange={(e) => onChange("theme", e.currentTarget.value)}
            mb="xs"
          />
          <TextInput
            label="ジャンル"
            value={settings.genre}
            onChange={(e) => onChange("genre", e.currentTarget.value)}
            mb="xs"
          />
          <TextInput
            label="時代"
            value={settings.era}
            onChange={(e) => onChange("era", e.currentTarget.value)}
            mb="xs"
          />
          <TextInput
            label="舞台"
            value={settings.stage}
            onChange={(e) => onChange("stage", e.currentTarget.value)}
            mb="xs"
          />
          <Textarea
            label="ルール"
            value={settings.rules}
            onChange={(e) => onChange("rules", e.currentTarget.value)}
            autosize
            minRows={2}
            mb="md"
          />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
