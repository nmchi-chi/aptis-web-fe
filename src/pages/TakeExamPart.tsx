import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Loader, Center, Stack, Button, Text, Radio, TextInput, Group, Accordion, Select } from '@mantine/core';
import { userExamService } from '../services/userExamService';

const TakeExamPart: React.FC = () => {
  const { examSetId, partType } = useParams<{ examSetId: string; partType: string }>();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<any>({});
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [userPart2Answers, setUserPart2Answers] = useState<any>({});

  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy exam_id từ exam set detail (giả sử partType là exam_type)
        const examSetDetail = await userExamService.getUserExamSetDetail(Number(examSetId));
        const examPart = examSetDetail.exams.find((e: any) => e.exam_type === partType);
        if (!examPart) throw new Error('Không tìm thấy part này');
        const examDetail = await userExamService.getUserExamDetail(examPart.id);
        setExam(examDetail);
      } catch (err) {
        setError('Không lấy được dữ liệu bài thi.');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examSetId, partType]);

  useEffect(() => {
    if (!exam) return;
    let total = 0;
    // Đếm tổng số câu cho từng part
    if (Array.isArray(exam.part1)) {
      if (exam.part1[0]?.questions) {
        exam.part1.forEach((group: any) => {
          total += group.questions.length;
        });
      } else {
        total += exam.part1.length;
      }
    }
    if (Array.isArray(exam.part3)) {
      exam.part3.forEach((item: any) => {
        if (Array.isArray(item.questions)) total += item.questions.length;
      });
    }
    if (Array.isArray(exam.part4)) {
      exam.part4.forEach((item: any) => {
        if (Array.isArray(item.questions)) total += item.questions.length;
      });
    }
    if (Array.isArray(exam.part2)) {
      exam.part2.forEach((item: any, idx: number) => {
        if (Array.isArray(item.options)) {
          item.options.forEach((_: string, i: number) => {
            const personKeys = ['a', 'b', 'c', 'd'];
            const personLabels = ['A', 'B', 'C', 'D'];
            const correctPersons = personKeys
              .map((key, idx2) => (item[key] === i + 1 ? personLabels[idx2] : null))
              .filter(Boolean);
            if (correctPersons.length > 0) total++;
          });
        }
      });
    }
    setTotalQuestions(total);
  }, [exam]);

  useEffect(() => {
    if (!submitted) return;
    let correct = 0;
    if (partType === 'reading') {
      // --- Reading logic ---
      if (Array.isArray(exam.part1)) {
        exam.part1.forEach((group: any, gIdx: number) => {
          group.questions.forEach((q: any, qIdx: number) => {
            const qKey = `r1_g${gIdx}_q${qIdx}`;
            if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
          });
        });
      }
      if (Array.isArray(exam.part2)) {
        exam.part2.forEach((topic: any, idx: number) => {
          topic.sentences.forEach((s: any, sIdx: number) => {
            if (s.is_example_first) return;
            const qKey = `r2_${idx}_${sIdx}`;
            if (userAnswers[qKey] === String(s.key)) correct++;
          });
        });
      }
      if (Array.isArray(exam.part3)) {
        exam.part3.forEach((item: any, idx: number) => {
          item.questions.forEach((q: any, qIdx: number) => {
            const qKey = `r3_${idx}_${qIdx}`;
            if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
          });
        });
      }
      if (Array.isArray(exam.part4)) {
        exam.part4.forEach((item: any, idx: number) => {
          item.questions.forEach((q: any, qIdx: number) => {
            const qKey = `r4_${idx}_${qIdx}`;
            const correctIdx = Number(q.correct_answer);
            if (userAnswers[qKey] === String(correctIdx)) correct++;
          });
        });
      }
    } else {
      // --- Listening logic ---
      if (Array.isArray(exam.part1)) {
        if (exam.part1[0]?.questions) {
          exam.part1.forEach((group: any, gIdx: number) => {
            if (!group.questions) return;
            group.questions.forEach((q: any, qIdx: number) => {
              const qKey = `g${gIdx}_q${qIdx}`;
              if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
            });
          });
        } else {
          exam.part1.forEach((q: any, qIdx: number) => {
            const correctIdx = Number(q.correct_answer) - 1;
            const qKey = `q${qIdx}`;
            if (q.options && userAnswers[qKey] === q.options[correctIdx]) correct++;
          });
        }
      }
      if (Array.isArray(exam.part3)) {
        exam.part3.forEach((item: any, idx: number) => {
          if (Array.isArray(item.questions)) {
            item.questions.forEach((_: string, qIdx: number) => {
              const qKey = `p3_${idx}_${qIdx}`;
              if (
                userAnswers[qKey]?.trim().toLowerCase() ===
                (item.correct_answers && item.correct_answers[qIdx]
                  ? item.correct_answers[qIdx].trim().toLowerCase()
                  : '')
              )
                correct++;
            });
          }
        });
      }
      if (Array.isArray(exam.part4)) {
        exam.part4.forEach((item: any, idx: number) => {
          if (Array.isArray(item.questions)) {
            item.questions.forEach((_: string, qIdx: number) => {
              const correctIdx =
                item.correct_answers && item.correct_answers[qIdx]
                  ? Number(item.correct_answers[qIdx]) - 1
                  : -1;
              const qKey = `p4_${idx}_${qIdx}`;
              if (
                item.options &&
                item.options[qIdx] &&
                userAnswers[qKey] === item.options[qIdx][correctIdx]
              )
                correct++;
            });
          }
        });
      }
      if (Array.isArray(exam.part2)) {
        exam.part2.forEach((item: any, idx: number) => {
          if (Array.isArray(item.options)) {
            item.options.forEach((_: string, i: number) => {
              const personKeys = ['a', 'b', 'c', 'd'];
              const personLabels = ['A', 'B', 'C', 'D'];
              const correctPersons = personKeys
                .map((key, idx2) => (item[key] === i + 1 ? personLabels[idx2] : null))
                .filter(Boolean);
              if (correctPersons.length > 0) {
                const answerKey = `p2_${idx}_${i}`;
                const userValue = userPart2Answers[answerKey] || '';
                if (userValue) {
                  if (correctPersons.includes(userValue)) correct++;
                } else {
                  // Không chọn, chỉ đúng nếu không có người đúng (nhưng đã filter ở trên là phải có người đúng)
                  // => Không cộng điểm
                }
              }
            });
          }
        });
      }
    }
    setCorrectCount(correct);
  }, [submitted, exam, userAnswers, partType, userPart2Answers]);

  // Xử lý chọn đáp án
  const handleChange = (qKey: string, value: string) => {
    setUserAnswers((prev: any) => ({ ...prev, [qKey]: value }));
  };

  // Chấm điểm và hiển thị kết quả
  const handleSubmit = () => {
    setSubmitted(true);
  };

  // Component phát audio từ audio_link (dùng userExamService, tham khảo logic admin)
  function AudioPlayer({ audioPath }: { audioPath: string }) {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePlay = async () => {
      setLoading(true);
      try {
        if (audioPath.startsWith('https://drive.google.com/')) {
          setAudioUrl(audioPath);
        } else {
          const res = await userExamService.getUserExamAudio({ audio_path: audioPath });
          console.log('Audio API response:', res);
          const base64 = res.base64 || res.data || res.audio || '';
          if (base64) setAudioUrl(`data:audio/mp3;base64,${base64}`);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ marginBottom: 8 }}>
        {!audioUrl && (
          <Button size="xs" onClick={handlePlay} loading={loading} mb={4}>
            Nghe Audio
          </Button>
        )}
        {audioUrl && <audio src={audioUrl} controls autoPlay style={{ display: 'block', marginTop: 4 }} />}
      </div>
    );
  }

  if (loading) {
    return <Center style={{ height: '60vh' }}><Loader /></Center>;
  }
  if (error) {
    return <Center style={{ height: '60vh' }}><Text color="red">{error}</Text></Center>;
  }
  if (!exam) {
    return <Center style={{ height: '60vh' }}><Text>Không tìm thấy dữ liệu bài thi.</Text></Center>;
  }

  // --- READING PART 1 ---
  const renderReadingPart1 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part1) && exam.part1.length > 0 ? (
        exam.part1.map((group: any, gIdx: number) => (
          <Paper key={gIdx} withBorder p="md">
            <Title order={4}>Group {group.group}</Title>
            {group.questions.map((q: any, qIdx: number) => {
              const qKey = `r1_g${gIdx}_q${qIdx}`;
              const correct =
                submitted &&
                userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
              return (
                <div key={qKey} style={{ marginBottom: 16 }}>
                  <Text fw={500}>{q.sentence}</Text>
                  <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                    {q.options.map((opt: string, i: number) => {
                      const isCorrect = opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                      return (
                        <Radio
                          key={i}
                          value={opt}
                          checked={userAnswers[qKey] === opt}
                          onChange={() => handleChange(qKey, opt)}
                          label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>}
                        />
                      );
                    })}
                  </Group>
                  {submitted && (
                    <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                      {correct ? 'Đúng' : `Sai. Đáp án: ${q.correct_answer}`}
                    </Text>
                  )}
                </div>
              );
            })}
          </Paper>
        ))
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  // --- READING PART 2 ---
  const renderReadingPart2 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
        exam.part2.map((topic: any, idx: number) => (
          <Paper key={idx} withBorder p="md">
            <Title order={4}>{topic.topic}</Title>
            <Stack gap={4} mt={4} mb={16}>
              {topic.sentences.map((s: any, sIdx: number) => (
                <Text key={sIdx}>
                  <b>{sIdx}.</b> {s.text}
                  {s.is_example_first && <span style={{ marginLeft: 8, color: 'blue' }}>(Example)</span>}
                </Text>
              ))}
            </Stack>
            <Stack gap={12}>
              {topic.sentences.map((s: any, sIdx: number) => {
                if (s.is_example_first) return null;
                const qKey = `r2_${idx}_${sIdx}`;
                const correct = submitted && userAnswers[qKey] === String(s.key);
                return (
                  <div key={qKey} style={{ marginBottom: 16 }}>
                    <Text fw={500}>{s.text}</Text>
                    <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                      {topic.sentences.map((dummy: any, optIdx: number) => (
                        <Radio
                          key={optIdx}
                          value={String(optIdx)}
                          checked={userAnswers[qKey] === String(optIdx)}
                          onChange={() => handleChange(qKey, String(optIdx))}
                          label={<span>{optIdx}</span>}
                        />
                      ))}
                    </Group>
                    {submitted && (
                      <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                        {correct ? 'Đúng' : `Sai. Đáp án: ${s.key}`}
                      </Text>
                    )}
                  </div>
                );
              })}
            </Stack>
          </Paper>
        ))
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  // --- READING PART 3 ---
  const renderReadingPart3 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part3) && exam.part3.length > 0 ? (
        exam.part3.map((item: any, idx: number) => (
          <Paper key={idx} withBorder p="md">
            <Title order={4}>{item.topic}</Title>
            <Stack gap={4} mt={4}>
              <Text fw={500}>Person A: <span style={{ fontWeight: 400 }}>{item.person_A}</span></Text>
              <Text fw={500}>Person B: <span style={{ fontWeight: 400 }}>{item.person_B}</span></Text>
              <Text fw={500}>Person C: <span style={{ fontWeight: 400 }}>{item.person_C}</span></Text>
              <Text fw={500}>Person D: <span style={{ fontWeight: 400 }}>{item.person_D}</span></Text>
            </Stack>
            <Stack gap={12} mt={16}>
              {item.questions.map((q: any, qIdx: number) => {
                const qKey = `r3_${idx}_${qIdx}`;
                const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                const options = ['Person_A', 'Person_B', 'Person_C', 'Person_D'];
                return (
                  <div key={qKey} style={{ marginBottom: 16 }}>
                    <Text fw={500}>{q.text}</Text>
                    <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                      {options.map((opt, i) => (
                        <Radio
                          key={i}
                          value={opt}
                          checked={userAnswers[qKey] === opt}
                          onChange={() => handleChange(qKey, opt)}
                          label={<span style={{ fontWeight: submitted && q.correct_answer === opt ? 'bold' : undefined }}>{`Person ${String.fromCharCode(65 + i)}`}</span>}
                        />
                      ))}
                    </Group>
                    {submitted && (
                      <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                        {correct ? 'Đúng' : `Sai. Đáp án: Person ${q.correct_answer.slice(-1)}`}
                      </Text>
                    )}
                  </div>
                );
              })}
            </Stack>
          </Paper>
        ))
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  // --- READING PART 4 ---
  const renderReadingPart4 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part4) && exam.part4.length > 0 ? (
        exam.part4.map((item: any, idx: number) => (
          <Paper key={idx} withBorder p="md">
            <Title order={4}>{item.topic}</Title>
            {item.questions.map((q: any, qIdx: number) => {
              const qKey = `r4_${idx}_${qIdx}`;
              const correctIdx = Number(q.correct_answer);
              const correct = submitted && userAnswers[qKey] === String(correctIdx);
              return (
                <div key={qKey} style={{ marginBottom: 16 }}>
                  <Text fw={500}>{q.text}</Text>
                  <Select
                    data={item.options.map((opt: string, i: number) => ({ value: String(i), label: opt }))}
                    value={userAnswers[qKey] || ''}
                    onChange={val => handleChange(qKey, val || '')}
                    placeholder="Chọn đáp án"
                    disabled={submitted}
                  />
                  {submitted && (
                    <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                      {correct ? 'Đúng' : `Sai. Đáp án: ${item.options[correctIdx]}`}
                    </Text>
                  )}
                </div>
              );
            })}
          </Paper>
        ))
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  // Render part1 (cả dạng group và dạng mảng câu hỏi)
  const renderPart1 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part1) && exam.part1.length > 0 ? (
        exam.part1[0]?.questions
          ? exam.part1.map((group: any, gIdx: number) => (
              <Paper key={gIdx} withBorder p="md">
                <Title order={4}>Group {group.group}</Title>
                {group.questions.map((q: any, qIdx: number) => {
                  const qKey = `g${gIdx}_q${qIdx}`;
                  const correct =
                    submitted &&
                    userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                  return (
                    <div key={qKey} style={{ marginBottom: 16 }}>
                      <Text fw={500}>{q.sentence}</Text>
                      {q.audio_link && <AudioPlayer audioPath={q.audio_link} />}
                      {q.options ? (
                        <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                          {q.options.map((opt: string, i: number) => {
                            const correctIdx = Number(q.correct_answer) - 1;
                            const isCorrect = i === correctIdx;
                            return (
                              <div
                                key={i}
                                style={{
                                  background: 'transparent',
                                  borderRadius: 6,
                                  padding: '2px 8px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Radio
                                  value={opt}
                                  checked={userAnswers[qKey] === opt}
                                  onChange={() => handleChange(qKey, opt)}
                                  label={
                                    <span style={{
                                      fontWeight: submitted && isCorrect ? 'bold' : undefined
                                    }}>
                                      {opt}
                                    </span>
                                  }
                                />
                              </div>
                            );
                          })}
                        </Group>
                      ) : (
                        <TextInput
                          value={userAnswers[qKey] || ''}
                          onChange={e => handleChange(qKey, e.target.value)}
                          disabled={submitted}
                          placeholder="Nhập đáp án"
                          mt={4}
                          error={submitted && !correct}
                        />
                      )}
                      {submitted && (
                        <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                          {correct ? 'Đúng' : `Sai`}
                        </Text>
                      )}
                    </div>
                  );
                })}
              </Paper>
            ))
          : exam.part1.map((q: any, qIdx: number) => {
              const qKey = `q${qIdx}`;
              const correctIdx = Number(q.correct_answer) - 1;
              const correct =
                submitted &&
                userAnswers[qKey]?.trim().toLowerCase() ===
                  (q.options && q.options[correctIdx]
                    ? q.options[correctIdx].trim().toLowerCase()
                    : (q.correct_answer + '').trim().toLowerCase());
              return (
                <Paper key={qKey} withBorder p="md">
                  <Text fw={500}>{q.question}</Text>
                  {q.audio_link && <AudioPlayer audioPath={q.audio_link} />}
                  {q.options ? (
                    <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                      {q.options.map((opt: string, i: number) => {
                        const correctIdx = Number(q.correct_answer) - 1;
                        const isCorrect = i === correctIdx;
                        return (
                          <div
                            key={i}
                            style={{
                              background: 'transparent',
                              borderRadius: 6,
                              padding: '2px 8px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Radio
                              value={opt}
                              label={
                                <span style={{
                                  fontWeight: submitted && isCorrect ? 'bold' : undefined
                                }}>
                                  {opt}
                                </span>
                              }
                            />
                          </div>
                        );
                      })}
                    </Group>
                  ) : (
                    <TextInput
                      value={userAnswers[qKey] || ''}
                      onChange={e => handleChange(qKey, e.target.value)}
                      disabled={submitted}
                      placeholder="Nhập đáp án"
                      mt={4}
                      error={submitted && !correct}
                    />
                  )}
                  {submitted && (
                    <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                      {correct
                        ? 'Đúng'
                        : `Sai`}
                    </Text>
                  )}
                </Paper>
              );
            })
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  // Render part2
  const renderPart2 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
        exam.part2.map((item: any, idx: number) => (
          <Paper key={idx} withBorder p="md">
            <Title order={4}>{item.topic}</Title>
            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
            {item.options && (
              <div>
                {item.options.map((opt: string, i: number) => {
                  const personKeys = ['a', 'b', 'c', 'd'];
                  const personLabels = ['A', 'B', 'C', 'D'];
                  // Tìm người thực tế ứng với option này
                  const correctPersons = personKeys
                    .map((key, idx) => (item[key] === i + 1 ? personLabels[idx] : null))
                    .filter(Boolean);
                  const answerKey = `p2_${idx}_${i}`;
                  const userValue = userPart2Answers[answerKey] || '';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ flex: 1 }}>{opt}</span>
                      <Select
                        data={personLabels.map(lab => ({ value: lab, label: lab }))}
                        value={userValue}
                        onChange={val => setUserPart2Answers((prev: any) => ({ ...prev, [answerKey]: val }))}
                        placeholder="Chọn người"
                        disabled={submitted}
                        style={{ width: 80, marginLeft: 8 }}
                      />
                      {submitted && (
                        userValue
                          ? (
                              <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                                {correctPersons.join(', ')}
                              </span>
                            )
                          : (
                              correctPersons.length === 0
                                ? <span style={{ marginLeft: 8, fontWeight: 'bold' }}>Đúng</span>
                                : <span style={{ marginLeft: 8, fontWeight: 'bold' }}>Sai. Đáp án: {correctPersons.join(', ')}</span>
                            )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Paper>
        ))
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  // Render part3
  const renderPart3 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part3) && exam.part3.length > 0 ? (
        exam.part3.map((item: any, idx: number) => (
          <Paper key={idx} withBorder p="md">
            <Title order={4}>{item.topic}</Title>
            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
            {item.questions && item.questions.map((q: string, qIdx: number) => {
              const qKey = `p3_${idx}_${qIdx}`;
              const correct =
                submitted &&
                userAnswers[qKey]?.trim().toLowerCase() ===
                  (item.correct_answers && item.correct_answers[qIdx]
                    ? item.correct_answers[qIdx].trim().toLowerCase()
                    : '');
              return (
                <div key={qKey} style={{ marginBottom: 16 }}>
                  <Text fw={500}>{q}</Text>
                  <TextInput
                    value={userAnswers[qKey] || ''}
                    onChange={e => handleChange(qKey, e.target.value)}
                    disabled={submitted}
                    placeholder="Nhập đáp án (MAN/WOMAN/BOTH)"
                    mt={4}
                    error={submitted && !correct}
                  />
                  {submitted && (
                    <Text size="sm" color={correct ? 'green' : 'red'} mt={4}>
                      {correct
                        ? 'Đúng'
                        : `Sai. Đáp án: ${item.correct_answers ? item.correct_answers[qIdx] : ''}`}
                    </Text>
                  )}
                </div>
              );
            })}
          </Paper>
        ))
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  // Render part4
  const renderPart4 = () => (
    <Stack gap="md">
      {Array.isArray(exam.part4) && exam.part4.length > 0 ? (
        exam.part4.map((item: any, idx: number) => (
          <Paper key={idx} withBorder p="md">
            <Title order={4}>{item.topic}</Title>
            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
            {item.questions && item.questions.map((q: string, qIdx: number) => {
              const qKey = `p4_${idx}_${qIdx}`;
              const correctIdx =
                item.correct_answers && item.correct_answers[qIdx]
                  ? Number(item.correct_answers[qIdx]) - 1
                  : -1;
              const correct =
                submitted &&
                userAnswers[qKey]?.trim().toLowerCase() ===
                  (item.options && item.options[qIdx] && item.options[qIdx][correctIdx]
                    ? item.options[qIdx][correctIdx].trim().toLowerCase()
                    : '');
              return (
                <div key={qKey} style={{ marginBottom: 16 }}>
                  <Text fw={500}>{q}</Text>
                  {item.options && item.options[qIdx] ? (
                    <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                      {item.options[qIdx].map((opt: string, i: number) => {
                        const correctIdx = Number(item.correct_answers[qIdx]) - 1;
                        const isCorrect = i === correctIdx;
                        return (
                          <div
                            key={i}
                            style={{
                              background: 'transparent',
                              borderRadius: 6,
                              padding: '2px 8px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Radio
                              value={opt}
                              label={
                                <span style={{
                                  fontWeight: submitted && isCorrect ? 'bold' : undefined
                                }}>
                                  {opt}
                                </span>
                              }
                            />
                          </div>
                        );
                      })}
                    </Group>
                  ) : null}
                  {submitted && (
                    <Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>
                      {correct
                        ? 'Đúng'
                        : 'Sai'}
                    </Text>
                  )}
                </div>
              );
            })}
          </Paper>
        ))
      ) : (
        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
      )}
    </Stack>
  );

  return (
    <Paper shadow="sm" p="xl" radius="md" withBorder>
      <Title order={2} mb="lg">Làm bài: {exam.title}</Title>
      {submitted && (
        <Text size="lg" color="blue" mb="md" fw="bold">
          Kết quả: {correctCount}/{totalQuestions} câu đúng
        </Text>
      )}
      <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
        <Accordion defaultValue="part1">
          {exam.part1 && (
            <Accordion.Item value="part1">
              <Accordion.Control>Part 1</Accordion.Control>
              <Accordion.Panel>
                {partType === 'reading' ? renderReadingPart1() : renderPart1()}
              </Accordion.Panel>
            </Accordion.Item>
          )}
          {exam.part2 && (
            <Accordion.Item value="part2">
              <Accordion.Control>Part 2</Accordion.Control>
              <Accordion.Panel>
                {partType === 'reading' ? renderReadingPart2() : renderPart2()}
              </Accordion.Panel>
            </Accordion.Item>
          )}
          {exam.part3 && (
            <Accordion.Item value="part3">
              <Accordion.Control>Part 3</Accordion.Control>
              <Accordion.Panel>
                {partType === 'reading' ? renderReadingPart3() : renderPart3()}
              </Accordion.Panel>
            </Accordion.Item>
          )}
          {exam.part4 && (
            <Accordion.Item value="part4">
              <Accordion.Control>Part 4</Accordion.Control>
              <Accordion.Panel>
                {partType === 'reading' ? renderReadingPart4() : renderPart4()}
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>
        <Group mt="xl">
          <Button type="submit" disabled={submitted}>Nộp bài</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
        </Group>
      </form>
    </Paper>
  );
};

export default TakeExamPart; 