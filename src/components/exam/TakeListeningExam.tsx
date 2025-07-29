import React, { useCallback, useRef, useState } from 'react';
import { Paper, Title, Stack, Text, Group, Radio, Select, Button, Box } from '@mantine/core';
import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import { userExamService } from '../../services/userExamService';

interface TakeListeningExamProps {
  exam: any;
  userAnswers: any;
  userPart2Answers?: any;
  submitted: boolean;
  onAnswerChange: (key: string, value: string) => void;
  onPart2AnswerChange: (key: string, value: string | string[]) => void;
}

type AudioPlayerProps = {
  audioPath: string;
  isSubmitedMode: boolean;
};

function AudioPlayer({ audioPath, isSubmitedMode }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playCount, setPlayCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleButtonClick = async () => {
    if (loading) return;

    // Nếu ở chế độ làm bài và đã hết 2 lượt thì không phát nữa
    if (!isSubmitedMode && playCount >= 2) return;

    const audio = audioRef.current;

    // Đang phát → dừng lại, tính là một lượt nếu là exam mode
    if (audio && isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      if (!isSubmitedMode) setPlayCount((prev) => prev + 1);
      return;
    }

    // Nếu đã có URL → phát lại từ đầu
    if (audioUrl && audio) {
      audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
      return;
    }

    // Nếu chưa có URL → fetch từ server
    setLoading(true);
    try {
      const response = await userExamService.getUserExamAudio({ audio_path: audioPath });

      let base64;
      if (typeof response === 'string') base64 = response;
      else if (response?.base64) base64 = response.base64;
      else if (response?.audio?.base64) base64 = response.audio.base64;
      else if (response?.audio) base64 = response.audio;
      else if (response?.audio_data) base64 = response.audio_data;
      else if (response?.data) base64 = response.data;
      else throw new Error('Invalid audio response');

      const blob = await fetch(`data:audio/mpeg;base64,${base64}`).then((res) => res.blob());
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          });
        }
      }, 100);
    } catch (err) {
      console.error('Audio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (!isSubmitedMode) setPlayCount((prev) => prev + 1);
  };

  // Ẩn button nếu đã nghe 2 lần và đang ở exam mode
  const isLimitReached = !isSubmitedMode && playCount >= 2;

  return (
    <div style={{ marginBottom: 8 }}>
      {!isLimitReached ? (
        <Button
          variant={isPlaying ? 'light' : 'filled'}
          size="xs"
          onClick={handleButtonClick}
          loading={loading}
          mb={4}
          leftSection={
            isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />
          }
        >
          {isPlaying
            ? 'Pause Audio'
            : !isSubmitedMode
              ? `Play Audio`
              : 'Play Audio'}
        </Button>
      ) : (
        <Text size="sm" c="gray">
          Audio limit reached (2/2 plays)
        </Text>
      )}

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          style={{ display: 'none' }}
          onEnded={handleEnded}
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
                              <Radio size='md'
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
                        <AudioPlayer isSubmitedMode={submitted} audioPath={q.audio_link} />
                      </div>
                    )}
                    <Group gap={16} mt={8} style={submitted ? { pointerEvents: 'none' } : {}}>
                      {Array.isArray(q.options) && q.options.map((opt: string, i: number) => {
                        const isCorrect = i === correctIdx;
                        return (
                          <Radio size='md'
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
                      <>
                        <Text fw='bold' size="sm" c={correct ? 'green' : 'red'} mt={8}>
                          {correct ? 'Đúng' : `Sai`}
                        </Text>

                        {/* 2 cột Transcript và Explain */}
                        <Group gap="lg" align="flex-start" mt="md">
                          {/* Cột 1: Transcript */}
                          <Box style={{ flex: 1 }}>
                            <Title order={4} mb="sm" style={{ color: '#285325' }}>Transcript</Title>
                            {q.transcript && (
                              <Paper p="md" style={{ backgroundColor: '#f8f9fa', border: '1px solid #22c55e' }}>
                                <Text c='#26522b' size="sm" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                                  {q.transcript}
                                </Text>
                              </Paper>
                            )}
                          </Box>

                          {/* Cột 2: Explain */}
                          <Box style={{ flex: 1 }}>
                            <Title order={4} mb="sm" style={{ color: '#285325' }}>Explain</Title>
                            <Paper p="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                              <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={4}>
                                Question: {q.question}
                              </Text>
                              <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.5', wordBreak: 'break-word' }}>
                                {q.explain}
                              </Text>
                            </Paper>
                          </Box>
                        </Group>
                      </>
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
                    <AudioPlayer isSubmitedMode={submitted} audioPath={item.audio_link} />
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
                          maxDropdownHeight={500}
                        />
                        {submitted && !correct && (<Text fw='bold' size="sm" c="red" ml={16}>Answer: {correctOption}</Text>)}
                        {submitted && correct && (<Text fw='bold' size="sm" c="green" ml={16}>Đúng</Text>)}
                      </div>
                    );
                  })}
                </div>

                {/* 2 cột Transcript và Explain cho mỗi topic */}
                {submitted && (
                  <Group gap="lg" align="flex-start" mt="md">
                    {/* Cột 1: Transcript */}
                    <Box style={{ flex: 1 }}>
                      <Title order={4} mb="sm" style={{ color: '#285325' }}>Transcript</Title>
                      {item.transcript && (
                        <Paper p="md" style={{ backgroundColor: '#f8f9fa', border: '1px solid #22c55e' }}>
                          <Text c='#26522b' size="sm" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                            {item.transcript}
                          </Text>
                        </Paper>
                      )}
                    </Box>

                    {/* Cột 2: Explain */}
                    <Box style={{ flex: 1 }}>
                      <Title order={4} mb="sm" style={{ color: '#285325' }}>Explain</Title>
                      <Paper p="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                        <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={4}>
                          Topic: {item.topic}
                        </Text>
                        <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.5', wordBreak: 'break-word' }}>
                          {item.explain}
                        </Text>
                      </Paper>
                    </Box>
                  </Group>
                )}
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
                    <AudioPlayer isSubmitedMode={submitted} audioPath={item.audio_link} />
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {item.questions && item.questions.map((q: string, qIdx: number) => {
                    const qKey = `p3_${idx}_${qIdx}`;
                    const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === (item.correct_answers && item.correct_answers[qIdx] ? item.correct_answers[qIdx].trim().toLowerCase() : '');
                    return (
                      <div key={qKey} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <Text fw={500} style={{ minWidth: '200px', marginRight: 16 }}>{q}</Text>
                        <Select miw='200px'
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

                {/* 2 cột Transcript và Explain cho mỗi topic */}
                {submitted && (
                  <Group gap="lg" align="flex-start" mt="md">
                    {/* Cột 1: Transcript */}
                    <Box style={{ flex: 1 }}>
                      <Title order={4} mb="sm" style={{ color: '#285325' }}>Transcript</Title>
                      {item.transcript && (
                        <Paper p="md" style={{ backgroundColor: '#f8f9fa', border: '1px solid #22c55e' }}>
                          <Text c='#26522b' size="sm" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                            {item.transcript}
                          </Text>
                        </Paper>
                      )}
                    </Box>

                    {/* Cột 2: Explain */}
                    <Box style={{ flex: 1 }}>
                      <Title order={4} mb="sm" style={{ color: '#285325' }}>Explain</Title>
                      <Paper p="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                        <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={4}>
                          Topic: {item.topic}
                        </Text>
                        {item.explains && item.explains.map((explain: string, explainIdx: number) => (
                          <Box key={explainIdx} mb={explainIdx < item.explains.length - 1 ? 12 : 0}>
                            <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.5', wordBreak: 'break-word' }}>
                              {explain}
                            </Text>
                          </Box>
                        ))}
                      </Paper>
                    </Box>
                  </Group>
                )}
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
                      <AudioPlayer isSubmitedMode={submitted} audioPath={audio_link} />
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
                                  <Radio size='md'
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

                  {/* 2 cột Transcript và Explain cho mỗi topic */}
                  {submitted && (
                    <Group gap="lg" align="flex-start" mt="md">
                      {/* Cột 1: Transcript */}
                      <Box style={{ flex: 1 }}>
                        <Title order={4} mb="sm" style={{ color: '#285325' }}>Transcript</Title>
                        {items[0]?.transcript && (
                          <Paper p="md" style={{ backgroundColor: '#f8f9fa', border: '1px solid #22c55e' }}>
                            <Text c='#26522b' size="sm" style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                              {items[0].transcript}
                            </Text>
                          </Paper>
                        )}
                      </Box>

                      {/* Cột 2: Explain */}
                      <Box style={{ flex: 1 }}>
                        <Title order={4} mb="sm" style={{ color: '#285325' }}>Explain</Title>
                        <Paper p="md" style={{ backgroundColor: '#e6f4ea', border: '1px solid #22c55e' }}>
                          <Text fw={600} size="sm" style={{ color: '#26522b' }} mb={4}>
                            Topic: {topic}
                          </Text>
                          {items[0]?.explain && Array.isArray(items[0].explain) ? (
                            items[0].explain.map((explain: string, explainIdx: number) => (
                              <Box key={explainIdx} mb={explainIdx < items[0].explain.length - 1 ? 12 : 0}>
                                <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.5', wordBreak: 'break-word' }}>
                                  {explain}
                                </Text>
                              </Box>
                            ))
                          ) : (
                            <Text size="sm" style={{ color: '#418a47', whiteSpace: 'pre-line', lineHeight: '1.5', wordBreak: 'break-word' }}>
                              {items[0]?.explain}
                            </Text>
                          )}
                        </Paper>
                      </Box>
                    </Group>
                  )}
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
