import React, { useCallback, useState } from 'react';
import { Paper, Title, Stack, Text, Group, Radio, Select, Button } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { userExamService } from '../../services/userExamService';

interface TakeListeningExamProps {
  exam: any;
  userAnswers: any;
  userPart2Answers?: any;
  submitted: boolean;
  onAnswerChange: (key: string, value: string) => void;
  onPart2AnswerChange: (key: string, value: string | string[]) => void;
}

// Component phát audio từ audio_link
function AudioPlayer({ audioPath }: { audioPath: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    try {
      const base64 = await userExamService.getUserExamAudio({ audio_path: audioPath });
      if (base64) setAudioUrl(`data:audio/mp3;base64,${base64}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 8 }}>
      {!audioUrl && (
        <Button size="xs" onClick={handlePlay} loading={loading} mb={4} leftSection={<IconPlayerPlay size={16} />}>
          Nghe Audio
        </Button>
      )}
      {audioUrl && <audio controlsList="nodownload noplaybackrate"
        onContextMenu={e => e.preventDefault()} src={audioUrl} controls autoPlay style={{ display: 'block', marginTop: 4 }} />}
    </div>
  );
}

const TakeListeningExam: React.FC<TakeListeningExamProps> = ({
  exam,
  userAnswers,
  userPart2Answers,
  submitted,
  onAnswerChange,
  onPart2AnswerChange
}) => {
  const renderPart1 = useCallback(() => {
    if (!exam) return null;
    return (
    <Paper withBorder p="md" mb="md">
      <Title order={3} mb="sm">Part 1</Title>
      <Stack gap="md">
        {Array.isArray(exam.part1) && exam.part1.length > 0 ? (
          exam.part1[0]?.questions ? (
            // Grouped structure
            exam.part1.map((group: any, gIdx: number) => (
              <Paper key={gIdx} withBorder p="md">
                <Title order={4}>Group {group.group}</Title>
                {Array.isArray(group.questions) && group.questions.map((q: any, qIdx: number) => {
                  const qKey = `r1_g${gIdx}_q${qIdx}`;
                  const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                  return (
                    <div key={qKey} style={{ marginBottom: 16 }}>
                      <Text fw={500}>{q.sentence}</Text>
                      <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                        {Array.isArray(q.options) && q.options.map((opt: string, i: number) => {
                          const isCorrect = opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                          return (
                            <Radio
                              key={i}
                              value={opt}
                              checked={userAnswers[qKey] === opt}
                              onChange={() => onAnswerChange(qKey, opt)}
                              label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>}
                            />
                          );
                        })}
                      </Group>
                      {submitted && (
                        <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={4}>
                          {correct ? 'Đúng' : `Sai. Đáp án: ${q.correct_answer}`}
                        </Text>
                      )}
                    </div>
                  );
                })}
              </Paper>
            ))
          ) : (
            // Flat structure
            exam.part1.map((q: any, qIdx: number) => {
              const qKey = `p1_${qIdx}`;
              const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
              return (
                <Paper key={qIdx} withBorder p="md">
                  {q.audio_link && <AudioPlayer audioPath={q.audio_link} />}
                  <Text fw={500} mb={8}>{q.question}</Text>
                  <Group gap={12} style={submitted ? { pointerEvents: 'none' } : {}}>
                    {Array.isArray(q.options) && q.options.map((opt: string, i: number) => {
                      const isCorrect = String(i + 1) === String(q.correct_answer);
                      return (
                        <Radio
                          key={i}
                          value={opt}
                          checked={userAnswers[qKey] === opt}
                          onChange={() => onAnswerChange(qKey, opt)}
                          label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>}
                        />
                      );
                    })}
                  </Group>
                  {submitted && (
                    <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={4}>
                      {correct ? 'Đúng' : `Sai. Đáp án: ${q.options[Number(q.correct_answer) - 1]}`}
                    </Text>
                  )}
                </Paper>
              );
            })
          )
        ) : (
          <Text c="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
        )}
      </Stack>
    </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  const renderPart2 = useCallback(() => {
    if (!exam) return null;
    const personKeys = ['a', 'b', 'c', 'd'];
    const personLabels = ['A', 'B', 'C', 'D'];
    return (
    <Paper withBorder p="md" mb="md">
      <Title order={3} mb="sm">Part 2</Title>
      <Stack gap="md">
        {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
          exam.part2.map((item: any, idx: number) => (
            <Paper key={idx} withBorder p="md">
              <Title order={4}>{item.topic}</Title>
              {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
              <div>
                {Array.isArray(item.options) && item.options.map((opt: string, i: number) => {
                  const answerers = personKeys
                    .map((key, idx) => (item[key] === i + 1 ? personLabels[idx] : null))
                    .filter((person): person is string => person !== null);
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <Text fw={500} mb={4}>{opt}</Text>
                      {answerers.length > 0 && (
                        <Group gap={8}>
                          {answerers.map((person: string) => {
                            const answerKey = `p2_${idx}_${i}`;
                            const userValue = userPart2Answers?.[answerKey] || '';
                            return (
                              <div key={person} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Text size="sm">{person}:</Text>
                                <Select
                                  data={['A', 'B', 'C', 'D']}
                                  value={userValue}
                                  onChange={(value) => onPart2AnswerChange(answerKey, value || '')}
                                  placeholder="Chọn"
                                  size="xs"
                                  style={{ width: 80 }}
                                  disabled={submitted}
                                />
                                {submitted && (
                                  <Text size="xs" c={userValue === person ? 'green' : 'red'}>
                                    {userValue === person ? '✓' : `✗ (${person})`}
                                  </Text>
                                )}
                              </div>
                            );
                          })}
                        </Group>
                      )}
                    </div>
                  );
                })}
              </div>
            </Paper>
          ))
        ) : (
          <Text c="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
        )}
      </Stack>
    </Paper>
    );
  }, [exam, userPart2Answers, submitted, onPart2AnswerChange]);

  const renderPart3 = useCallback(() => {
    if (!exam) return null;
    return (
    <Paper withBorder p="md" mb="md">
      <Title order={3} mb="sm">Part 3</Title>
      <Stack gap="md">
        {Array.isArray(exam.part3) && exam.part3.length > 0 ? (
          exam.part3.map((item: any, idx: number) => (
            <Paper key={idx} withBorder p="md">
              <Title order={4}>{item.topic}</Title>
              {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
              {Array.isArray(item.questions) && item.questions.map((q: string, i: number) => {
                const qKey = `p3_${idx}_${i}`;
                const correctAnswer = item.correct_answers && item.correct_answers[i];
                const correct = submitted && userAnswers[qKey] === correctAnswer;
                return (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Text fw={500} mb={4}>{`Câu ${i + 1}: ${q}`}</Text>
                    <Select
                      data={['MAN', 'WOMAN', 'BOTH']}
                      value={userAnswers[qKey] || ''}
                      onChange={(value) => onAnswerChange(qKey, value || '')}
                      placeholder="Chọn đáp án"
                      disabled={submitted}
                    />
                    {submitted && (
                      <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={4}>
                        {correct ? 'Đúng' : `Sai. Đáp án: ${correctAnswer}`}
                      </Text>
                    )}
                  </div>
                );
              })}
            </Paper>
          ))
        ) : (
          <Text c="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
        )}
      </Stack>
    </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  const renderPart4 = useCallback(() => {
    if (!exam) return null;
    return (
    <Paper withBorder p="md" mb="md">
      <Title order={3} mb="sm">Part 4</Title>
      <Stack gap="md">
        {Array.isArray(exam.part4) && exam.part4.length > 0 ? (
          exam.part4.map((item: any, idx: number) => (
            <Paper key={idx} withBorder p="md">
              <Title order={4}>{item.topic}</Title>
              {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
              {Array.isArray(item.questions) && item.questions.map((q: string, qIdx: number) => {
                const qKey = `p4_${idx}_${qIdx}`;
                const correctAnswer = item.correct_answers && item.correct_answers[qIdx];
                const correct = submitted && userAnswers[qKey] === String(correctAnswer);
                return (
                  <div key={qIdx} style={{ marginBottom: 16 }}>
                    <Text fw={500} mb={8}>{q}</Text>
                    <Select
                      data={Array.isArray(item.options) && Array.isArray(item.options[qIdx]) ?
                        item.options[qIdx].map((opt: string, i: number) => ({
                          value: String(i + 1),
                          label: opt
                        })) : []
                      }
                      value={userAnswers[qKey] || ''}
                      onChange={(value) => onAnswerChange(qKey, value || '')}
                      placeholder="Chọn đáp án"
                      disabled={submitted}
                    />
                    {submitted && (
                      <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={4}>
                        {correct ? 'Đúng' : `Sai. Đáp án: ${item.options[qIdx] && item.options[qIdx][Number(correctAnswer) - 1]}`}
                      </Text>
                    )}
                  </div>
                );
              })}
            </Paper>
          ))
        ) : (
          <Text c="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
        )}
      </Stack>
    </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  // Early return if exam is not available
  if (!exam) {
    return <Text c="red">Đang tải dữ liệu bài thi...</Text>;
  }

  return (
    <>
      {renderPart1()}
      {renderPart2()}
      {renderPart3()}
      {renderPart4()}
    </>
  );
};

export default TakeListeningExam;
