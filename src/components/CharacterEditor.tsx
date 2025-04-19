import { FC } from "react";
import { Accordion, Textarea, TextInput, Title } from "@mantine/core";
import { Character } from "../pages/ChatAgent"; // Adjust import path if needed

interface CharacterEditorProps {
  characters: Character[];
  onChange: (
    index: number,
    field: keyof Character,
    value: string | number
  ) => void;
}

export const CharacterEditor: FC<CharacterEditorProps> = ({
  characters,
  onChange,
}) => {
  return (
    <div>
      <Title order={4} mb="xs">
        登場人物
      </Title>
      <Accordion variant="separated">
        {characters.map((char, index) => (
          <Accordion.Item key={char.number} value={`char-${char.number}`}>
            <Accordion.Control>
              #{char.number} {char.name} ({char.role})
            </Accordion.Control>
            <Accordion.Panel>
              <TextInput
                label="役割"
                value={char.role}
                onChange={(e) => onChange(index, "role", e.currentTarget.value)}
                mb="xs"
              />
              <TextInput
                label="名前"
                value={char.name}
                onChange={(e) => onChange(index, "name", e.currentTarget.value)}
                mb="xs"
              />
              <TextInput // Use TextInput for age as it can be string or number
                label="年齢"
                value={String(char.age)} // Convert to string for TextInput
                onChange={(e) => onChange(index, "age", e.currentTarget.value)} // Keep as string for flexibility
                mb="xs"
              />
              <TextInput
                label="性別"
                value={char.sex}
                onChange={(e) => onChange(index, "sex", e.currentTarget.value)}
                mb="xs"
              />
              <Textarea
                label="外見"
                value={char.appearance}
                onChange={(e) =>
                  onChange(index, "appearance", e.currentTarget.value)
                }
                autosize
                minRows={2}
                mb="xs"
              />
              <Textarea
                label="性格"
                value={char.personality}
                onChange={(e) =>
                  onChange(index, "personality", e.currentTarget.value)
                }
                autosize
                minRows={2}
                mb="xs"
              />
              <Textarea
                label="能力"
                value={char.ability}
                onChange={(e) =>
                  onChange(index, "ability", e.currentTarget.value)
                }
                autosize
                minRows={2}
                mb="md"
              />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};
