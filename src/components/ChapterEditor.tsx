import { FC } from "react";
import { Textarea, TextInput, Title, Box, Stack } from "@mantine/core";
import { Chapter, Scene } from "../pages/ChatAgent";

interface ChapterEditorProps {
  chapters: Chapter[];
  onChapterChange: (
    chapterIndex: number,
    field: keyof Chapter,
    value: string
  ) => void;
  onSceneChange: (
    chapterIndex: number,
    sceneIndex: number,
    field: keyof Scene,
    value: string
  ) => void;
}

export const ChapterEditor: FC<ChapterEditorProps> = ({
  chapters,
  onChapterChange,
  onSceneChange,
}) => {
  return (
    <Box>
      <Title order={4} mb="xs">
        本文
      </Title>
      <Stack gap="lg">
        {chapters.map((chap, chapIndex) => (
          <Box
            key={chap.number}
            p="md"
            bd="1px solid gray"
            style={{ borderRadius: "4px" }}
          >
            <Title order={5} mb="sm">
              第{chap.number}章
            </Title>
            <TextInput
              label="章タイトル"
              value={chap.title}
              onChange={(e) =>
                onChapterChange(chapIndex, "title", e.currentTarget.value)
              }
              mb="md"
            />
            <Title order={6} mb="xs">
              シーン
            </Title>
            <Stack gap="md">
              {chap.scenes.map((scene, sceneIndex) => (
                <Box
                  key={scene.number}
                  p="sm"
                  bd="1px solid gray"
                  style={{ borderRadius: "4px" }}
                >
                  <Title order={6} mb="xs">
                    シーン {scene.number}
                  </Title>
                  <Textarea
                    value={scene.content}
                    onChange={(e) =>
                      onSceneChange(
                        chapIndex,
                        sceneIndex,
                        "content",
                        e.currentTarget.value
                      )
                    }
                    autosize
                    minRows={5}
                    mb="xs"
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};
