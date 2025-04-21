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
          <Accordion.Item key={char.id} value={`char-${char.id}`}>
            <Accordion.Control>
              #{char.id} {char.name} ({char.role})
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
                value={String(char.age ?? "")} // Ensure value is always string, handle undefined/null
                onChange={(e) => onChange(index, "age", e.currentTarget.value)} // Keep as string for flexibility
                mb="xs"
              />
              <TextInput
                label="性別"
                value={char.sex}
                onChange={(e) => onChange(index, "sex", e.currentTarget.value)}
                mb="xs"
              />
              <TextInput
                label="別名・称号"
                value={char.aliases || ""}
                onChange={(e) =>
                  onChange(index, "aliases", e.currentTarget.value)
                }
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
                value={char.abilities || ""}
                onChange={(e) =>
                  onChange(index, "abilities", e.currentTarget.value)
                }
                autosize
                minRows={2}
                mb="xs"
              />
              <Textarea
                label="背景"
                value={char.backstory || ""}
                onChange={(e) =>
                  onChange(index, "backstory", e.currentTarget.value)
                }
                autosize
                minRows={2}
                mb="xs"
              />
              <Textarea
                label="動機"
                value={char.motivation || ""}
                onChange={(e) =>
                  onChange(index, "motivation", e.currentTarget.value)
                }
                autosize
                minRows={2}
                mb="xs"
              />
              <Textarea
                label="目標"
                value={char.goal || ""}
                onChange={(e) => onChange(index, "goal", e.currentTarget.value)}
                autosize
                minRows={2}
                mb="xs"
              />
              <Textarea
                label="他キャラとの関係性"
                value={char.relationships || ""}
                onChange={(e) =>
                  onChange(index, "relationships", e.currentTarget.value)
                }
                autosize
                minRows={2}
                mb="xs"
              />
              <Textarea
                label="弱点"
                value={char.flaws || ""}
                onChange={(e) =>
                  onChange(index, "flaws", e.currentTarget.value)
                }
                autosize
                minRows={1}
                mb="xs"
              />
              <Textarea
                label="強み"
                value={char.strengths || ""}
                onChange={(e) =>
                  onChange(index, "strengths", e.currentTarget.value)
                }
                autosize
                minRows={1}
                mb="xs"
              />
              <Textarea
                label="所属"
                value={char.belonging || ""}
                onChange={(e) =>
                  onChange(index, "belonging", e.currentTarget.value)
                }
                autosize
                minRows={1}
                mb="md"
              />
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};
