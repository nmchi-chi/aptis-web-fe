import React, { useCallback } from 'react';
import { Paper, Title, Stack, Text, Group, Radio, Select, List } from '@mantine/core';

interface TakeGrammaVocabExamProps {
  exam: any;
  userAnswers: any;
  submitted: boolean;
  onAnswerChange: (key: string, value: string) => void;
}

const TakeGrammaVocabExam: React.FC<TakeGrammaVocabExamProps> = ({
  exam,
  userAnswers,
  submitted,
  onAnswerChange
}) => {
  // PART 1: Radio A/B/C
  const renderGVPart1 = useCallback(() => {
    if (!exam) return null;
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 1</Title>
        <Stack gap="md">
          {Array.isArray(exam.part1) && exam.part1.length > 0 ? (
            exam.part1.map((item: any, idx: number) => {
              const qKey = `gv1_q${idx}`;
              const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === item.correct_answer.trim().toLowerCase();
              return (
                <div key={qKey} style={{ marginBottom: 16 }}>
                  <Text fw={500}>{item.question}</Text>
                  <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                    {['A', 'B', 'C'].map((key) => {
                      const val = item[key];
                      const isCorrect = val === item.correct_answer;
                      return (
                        <Radio
                          key={key}
                          value={val}
                          checked={userAnswers[qKey] === val}
                          onChange={() => onAnswerChange(qKey, val)}
                          label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined, color: submitted && isCorrect ? 'green' : undefined }}>{key}: {val}</span>}
                        />
                      );
                    })}
                  </Group>
                  {submitted && (
                    <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={4}>
                      {correct ? 'Correct' : `Wrong. Answer: ${item.correct_answer}`}
                    </Text>
                  )}
                </div>
              );
            })
          ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
        </Stack>
      </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  // PART 2: Select
  const renderGVPart2 = useCallback(() => {
    if (!exam) return null;
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 2</Title>
        <Stack gap="md">
          {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
            exam.part2.map((group: any, gIdx: number) => (
              <Paper key={gIdx} withBorder p="md">
                <Title order={4}>{group.topic}</Title>
                <List>
                  {group.questions.map((q: any, qIdx: number) => {
                    const qKey = `gv2_g${gIdx}_q${qIdx}`;
                    const correct = submitted && userAnswers[qKey] === q.correct_answer;
                    // Tạo options cho Select từ group.options
                    const selectOptions = Object.entries(group.options).map(([k, v]) => ({ value: String(v), label: `${v}` }));
                    return (
                      <List.Item key={qKey}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <Text fw={500}>{q.question}</Text>
                          <Text fw={700} c="teal" mx={2}>+</Text>
                          <Select
                            data={selectOptions}
                            value={userAnswers[qKey] || ''}
                            onChange={val => onAnswerChange(qKey, val || '')}
                            placeholder="Chọn đáp án"
                            disabled={submitted}
                            error={submitted && !correct}
                            style={{ width: 220 }}
                            maxDropdownHeight={500}
                          />
                        </div>
                        {submitted && (
                          <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={4}>
                            {correct ? 'Correct' : `Wrong. Answer: ${q.correct_answer}`}
                          </Text>
                        )}
                      </List.Item>
                    );
                  })}
                </List>
              </Paper>
            ))
          ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
        </Stack>
      </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  if (!exam) {
    return <Text c="red">Đang tải dữ liệu bài thi...</Text>;
  }

  return (
    <>
      {renderGVPart1()}
      {renderGVPart2()}
    </>
  );
};

export default TakeGrammaVocabExam; 