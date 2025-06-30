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
      console.log('Loading audio for path:', audioPath);
      const response = await userExamService.getUserExamAudio({ audio_path: audioPath });
      console.log('Full audio response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'No response');

      // Check if response is string or object
      let base64;
      if (typeof response === 'string') {
        base64 = response;
      } else if (response && response.base64) {
        base64 = response.base64;
      } else if (response && response.audio && response.audio.base64) {
        base64 = response.audio.base64;
      } else if (response && response.audio) {
        base64 = response.audio;
      } else if (response && response.audio_data) {
        base64 = response.audio_data;
      } else if (response && response.data) {
        base64 = response.data;
      } else {
        console.error('Unexpected response format:', response);
        return;
      }

      console.log('Base64 length:', base64 ? base64.length : 0);
      console.log('Base64 preview:', base64 ? base64.substring(0, 100) + '...' : 'No data');

      if (base64) {
        // Try different MIME types
        const audioUrl = `data:audio/mpeg;base64,${base64}`;
        console.log('Setting audio URL:', audioUrl.substring(0, 100) + '...');
        setAudioUrl(audioUrl);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
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
      {audioUrl && (
        <audio
          controlsList="nodownload noplaybackrate"
          onContextMenu={e => e.preventDefault()}
          src={audioUrl}
          controls
          autoPlay
          style={{ display: 'block', marginTop: 4 }}
          onError={(e) => {
            console.error('Audio playback error:', e);
            console.error('Audio src:', audioUrl.substring(0, 100) + '...');
          }}
          onLoadStart={() => console.log('Audio load started')}
          onCanPlay={() => console.log('Audio can play')}
          onLoadedData={() => console.log('Audio data loaded')}
        />
      )}
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
                    const qKey = `p1_g${gIdx}_q${qIdx}`;
                    const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                    return (
                      <div key={qKey} style={{ marginBottom: 24 }}>
                        <Text fw={500} mb={8}>{q.sentence}</Text>
                        <Group gap={16} mt={8} style={submitted ? { pointerEvents: 'none' } : {}}>
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
                          <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={8}>
                            {correct ? 'Đúng' : `Sai`}
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
                const userSelectedOption = userAnswers[qKey];
                const correctIdx = Number(q.correct_answer) - 1; // Convert to 0-based index
                const correctOption = Array.isArray(q.options) && correctIdx >= 0 ? q.options[correctIdx] : '';
                const correct = submitted && userSelectedOption === correctOption;
                return (
                  <Paper key={qIdx} withBorder p="md" mb="md">
                    <Text fw={500} mb={12}>{q.question}</Text>
                    {q.audio_link && (
                      <div style={{ marginBottom: 16 }}>
                        <AudioPlayer audioPath={q.audio_link} />
                      </div>
                    )}
                    <Group gap={16} mt={8} style={submitted ? { pointerEvents: 'none' } : {}}>
                      {Array.isArray(q.options) && q.options.map((opt: string, i: number) => {
                        const isCorrect = i === correctIdx;
                        return (
                          <Radio
                            key={i}
                            value={opt}
                            checked={userAnswers[qKey] === opt}
                            onChange={() => onAnswerChange(qKey, opt)}
                            label={<span style={{
                              fontWeight: submitted && isCorrect ? 'bold' : undefined,
                              color: submitted && isCorrect ? 'green' : undefined,
                            }}>{opt}</span>}
                          />
                        );
                      })}
                    </Group>
                    {submitted && (
                      <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={8}>
                        {correct ? 'Đúng' : `Sai. Đáp án: ${correctOption}`}
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
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 2</Title>
        <Stack gap="md">
          {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
            exam.part2.map((item: any, idx: number) => (
              <Paper key={idx} withBorder p="md" mb="md">
                <Title order={4} mb={12}>{item.topic}</Title>
                {item.audio_link && (
                  <div style={{ marginBottom: 16 }}>
                    <AudioPlayer audioPath={item.audio_link} />
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {['a', 'b', 'c', 'd'].map((key, i) => {
                    const personLabel = String.fromCharCode(65 + i); // A, B, C, D
                    const answerKey = `p2_${idx}_${i}`;
                    const userValue = userPart2Answers[answerKey] || '';
                    const correctIdx = item[key] - 1;
                    const correctOption = item.options && correctIdx >= 0 ? item.options[correctIdx] : '';
                    const correct = submitted && userValue && userValue === correctOption;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ width: 40, fontWeight: 'bold', marginRight: 12 }}>{personLabel}</span>
                        <Select
                          data={item.options.map((opt: string) => ({ value: opt, label: opt }))}
                          value={userValue}
                          onChange={val => onPart2AnswerChange(answerKey, val || '')}
                          placeholder="Select answer"
                          disabled={submitted}
                          style={{ width: 240 }}
                          error={submitted && !correct}
                        />
                        {submitted && !correct && (<Text fw='bold' size="sm" c="red" ml={16}>Answer: {correctOption}</Text>)}
                        {submitted && correct && (<Text size="sm" c="green" ml={16}>Đúng</Text>)}
                      </div>
                    );
                  })}
                </div>
              </Paper>
            ))
          ) : (<Text c="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
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
              <Paper key={idx} withBorder p="md" mb="md">
                <Title order={4} mb={12}>{item.topic}</Title>
                {item.audio_link && (
                  <div style={{ marginBottom: 16 }}>
                    <AudioPlayer audioPath={item.audio_link} />
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {item.questions && item.questions.map((q: string, qIdx: number) => {
                    const qKey = `p3_${idx}_${qIdx}`;
                    const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === (item.correct_answers && item.correct_answers[qIdx] ? item.correct_answers[qIdx].trim().toLowerCase() : '');
                    return (
                      <div key={qKey} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <Text fw={500} style={{ minWidth: '200px', marginRight: 16 }}>{q}</Text>
                        <Select
                          data={['MAN', 'WOMAN', 'BOTH']}
                          value={userAnswers[qKey] || ''}
                          onChange={val => onAnswerChange(qKey, val || '')}
                          placeholder="Select answer"
                          disabled={submitted}
                          style={{ width: 140 }}
                          error={submitted && !correct}
                        />
                        {submitted && !correct && (<Text fw='bold' size="sm" c="red" ml={16}>Answer: {item.correct_answers ? item.correct_answers[qIdx] : ''}</Text>)}
                        {submitted && correct && (<Text fw='bold' size="sm" c="green" ml={16}>Đúng</Text>)}
                      </div>
                    );
                  })}
                </div>
              </Paper>
            ))
          ) : <Text c="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>}
        </Stack>
      </Paper>
    );
  }, [exam, userAnswers, submitted, onAnswerChange]);

  const renderPart4 = useCallback(() => {
    if (!exam) return null;
    const topicMap: { [topic: string]: any[] } = {};
    if (Array.isArray(exam.part4)) {
      exam.part4.forEach((item: any) => {
        if (!topicMap[item.topic]) topicMap[item.topic] = [];
        topicMap[item.topic].push(item);
      });
    }
    return (
      <Paper withBorder p="md" mb="md">
        <Title order={3} mb="sm">Part 4</Title>
        <Stack gap="md">
          {Object.entries(topicMap).length > 0 ? (
            Object.entries(topicMap).map(([topic, items], topicIdx) => {
              const audio_link = items[0]?.audio_link;

              const allQuestions: {
                q: string;
                options: string[];
                correctIdx: number;
                qKey: string;
              }[] = [];

              items.forEach((item: any, itemIdx: number) => {
                if (item.questions && item.options && item.correct_answers) {
                  item.questions.forEach((q: string, qIdx: number) => {
                    const qKey = `p4_t${topicIdx}_i${itemIdx}_q${qIdx}`;
                    const correctIdx =
                      item.correct_answers?.[qIdx] != null
                        ? Number(item.correct_answers[qIdx]) - 1
                        : -1;
                    allQuestions.push({
                      q,
                      options: item.options[qIdx],
                      correctIdx,
                      qKey,
                    });
                  });
                }
              });

              return (
                <Paper key={topic} withBorder p="md" mb="md">
                  <Title order={4} mb={12}>{topic}</Title>
                  {audio_link && (
                    <div style={{ marginBottom: 16 }}>
                      <AudioPlayer audioPath={audio_link} />
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    {allQuestions.map((qObj) => {
                      const selectedIdx = Number(userAnswers[qObj.qKey]); // now value is index
                      const correct = submitted && selectedIdx === qObj.correctIdx;

                      return (
                        <div key={qObj.qKey} style={{ marginBottom: 24 }}>
                          <Text fw={500} mb={12}>{qObj.q}</Text>
                          <Radio.Group
                            name={qObj.qKey}
                            value={userAnswers[qObj.qKey] ?? null}
                            onChange={(value) =>
                              onAnswerChange(qObj.qKey, value)
                            }
                            mt={8}
                            style={submitted ? { pointerEvents: 'none' } : {}}
                          >
                            <Stack gap={8}>
                              {qObj.options.map((opt: string, i: number) => {
                                const isCorrect = i === qObj.correctIdx;
                                return (
                                  <Radio
                                    key={`${qObj.qKey}_opt_${i}`}
                                    value={String(i)}
                                    label={
                                      <span
                                        style={{
                                          fontWeight:
                                            submitted && isCorrect
                                              ? 'bold'
                                              : undefined,
                                          color:
                                            submitted && isCorrect
                                              ? 'green'
                                              : undefined,
                                        }}
                                      >
                                        {opt}
                                      </span>
                                    }
                                  />
                                );
                              })}
                            </Stack>
                          </Radio.Group>
                          {submitted && (
                            <Text
                              fw="bold"
                              size="sm"
                              c={correct ? 'green' : 'red'}
                              mt={8}
                            >
                              {correct ? 'Đúng' : 'Sai'}
                            </Text>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Paper>
              );
            })
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
