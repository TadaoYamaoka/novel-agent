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
            key={chap.id}
            p="md"
            bd="1px solid gray"
            style={{ borderRadius: "4px" }}
          >
            <Title order={5} mb="sm">
              第{chap.id}章
            </Title>
            <Textarea
              label="章概要"
              value={chap.summary || ""}
              onChange={(e) =>
                onChapterChange(chapIndex, "summary", e.currentTarget.value)
              }
              autosize
              minRows={2}
              mb="xs"
            />
            <Textarea
              label="章の目的"
              value={chap.goal || ""}
              onChange={(e) =>
                onChapterChange(chapIndex, "goal", e.currentTarget.value)
              }
              autosize
              minRows={2}
              mb="md"
            />
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
                  key={scene.id}
                  p="sm"
                  bd="1px solid gray"
                  style={{ borderRadius: "4px" }}
                >
                  <Title order={6} mb="xs">
                    シーン {scene.id}
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
                  <Textarea
                    label="場所／状況メモ"
                    value={scene.settingNotes || ""}
                    onChange={(e) =>
                      onSceneChange(
                        chapIndex,
                        sceneIndex,
                        "settingNotes",
                        e.currentTarget.value
                      )
                    }
                    autosize
                    minRows={1}
                    mb="xs"
                  />
                  <TextInput
                    label="経過時間"
                    value={scene.timeElapsed || ""}
                    onChange={(e) =>
                      onSceneChange(
                        chapIndex,
                        sceneIndex,
                        "timeElapsed",
                        e.currentTarget.value
                      )
                    }
                    mb="xs"
                  />
                  <Textarea
                    label="人物メモ"
                    value={scene.characterNotes || ""}
                    onChange={(e) =>
                      onSceneChange(
                        chapIndex,
                        sceneIndex,
                        "characterNotes",
                        e.currentTarget.value
                      )
                    }
                    autosize
                    minRows={1}
                    mb="xs"
                  />
                  <Textarea
                    label="伏線"
                    value={scene.foreshadowing || ""}
                    onChange={(e) =>
                      onSceneChange(
                        chapIndex,
                        sceneIndex,
                        "foreshadowing",
                        e.currentTarget.value
                      )
                    }
                    autosize
                    minRows={1}
                    mb="xs"
                  />
                  <Textarea
                    label="回収"
                    value={scene.payoff || ""}
                    onChange={(e) =>
                      onSceneChange(
                        chapIndex,
                        sceneIndex,
                        "payoff",
                        e.currentTarget.value
                      )
                    }
                    autosize
                    minRows={1}
                    mb="xs"
                  />
                  <Textarea
                    label="重要イベント (改行で区切り)"
                    value={scene.keyEvents?.join("\n") || ""}
                    onChange={(e) =>
                      onSceneChange(
                        chapIndex,
                        sceneIndex,
                        "keyEvents",
                        e.currentTarget.value
                      )
                    }
                    autosize
                    minRows={2}
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
