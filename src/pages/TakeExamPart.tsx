import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Loader, Center, Stack, Button, Text, Radio, TextInput, Group, Select } from '@mantine/core';
import { userExamService } from '../services/userExamService';
import { DropResult, DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const AudioPlayer = React.memo(function AudioPlayer({ audioPath }: { audioPath: string }) {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePlay = async () => {
        setLoading(true);
        try {
            const res = await userExamService.getUserExamAudio({ audio_path: audioPath });
            const base64 = res.base64 || res.data || res.audio || '';
            if (base64) setAudioUrl(`data:audio/mp3;base64,${base64}`);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginBottom: 8 }}>
            {!audioUrl && (
                <Button size="xs" onClick={handlePlay} loading={loading} mb={4}>Nghe Audio</Button>
            )}
            {audioUrl && (
                <audio
                    src={audioUrl}
                    controls
                    autoPlay
                    controlsList="nodownload noplaybackrate"
                    style={{ display: 'block', marginTop: 8, marginBottom: 12 }}
                />
            )}
        </div>
    );
});

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
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);

    useEffect(() => {
        const fetchExam = async () => {
            setLoading(true);
            setError(null);
            try {
                const examSetDetail = await userExamService.getUserExamSetDetail(Number(examSetId));
                const examPart = examSetDetail.exams.find((e: any) => e.exam_type === partType);
                if (!examPart) throw new Error('Không tìm thấy part này');
                setTimeLimit(examPart.time_limit);
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
        if (partType === 'reading' && Array.isArray(exam.part2)) {
            exam.part2.forEach((topic: any) => {
                const sentencesToOrder = topic.sentences.filter((s: any) => !s.is_example_first);
                total += sentencesToOrder.length;
            });
        }
        if (partType !== 'reading' && Array.isArray(exam.part2)) {
            exam.part2.forEach((item: any) => {
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
    }, [exam, partType]);

    useEffect(() => {
        if (!submitted) return;
        let correct = 0;
        if (partType === 'reading') {
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
                    const sentences = Array.isArray(topic.sentences)
                        ? topic.sentences.filter((s: any) => !s.is_example_first)
                        : [];
                    const dndKey = `r2_dnd_${idx}`;
                    const allKeys = sentences.map((s: any) => String(s.key));
                    const currentOrder = userAnswers[dndKey] ?? allKeys;
                    let orderedSentences = currentOrder.map((k: string) => sentences.find((s: any) => String(s.key) === k));
                    if (orderedSentences.some((s: any) => !s)) {
                        orderedSentences = sentences;
                    }
                    const correctOrder = [...sentences].sort((a, b) => a.key - b.key);
                    for (let i = 0; i < orderedSentences.length; i++) {
                        if (orderedSentences[i]?.key === correctOrder[i]?.key) correct++;
                    }
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
                            if (userAnswers[qKey]?.trim().toLowerCase() === (item.correct_answers && item.correct_answers[qIdx] ? item.correct_answers[qIdx].trim().toLowerCase() : '')) correct++;
                        });
                    }
                });
            }
            if (Array.isArray(exam.part4)) {
                exam.part4.forEach((item: any, idx: number) => {
                    if (Array.isArray(item.questions)) {
                        item.questions.forEach((_: string, qIdx: number) => {
                            const correctIdx = item.correct_answers && item.correct_answers[qIdx] ? Number(item.correct_answers[qIdx]) - 1 : -1;
                            const qKey = `p4_${idx}_${qIdx}`;
                            if (item.options && item.options[qIdx] && userAnswers[qKey] === item.options[qIdx][correctIdx]) correct++;
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
                            const correctPersons = personKeys.map((key, idx2) => (item[key] === i + 1 ? personLabels[idx2] : null)).filter(Boolean);
                            if (correctPersons.length > 0) {
                                const answerKey = `p2_${idx}_${i}`;
                                const userValue = userPart2Answers[answerKey] || '';
                                if (userValue) {
                                    if (correctPersons.includes(userValue)) correct++;
                                }
                            }
                        });
                    }
                });
            }
        }
        setCorrectCount(correct);
    }, [submitted, exam, userAnswers, partType, userPart2Answers]);

    useEffect(() => {
        if (timeLimit === undefined) return;
        setRemainingTime(timeLimit * 60);
        if (timeLimit <= 0) return;
        const interval = setInterval(() => {
            setRemainingTime(prev => {
                if (prev === undefined) return prev;
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLimit]);

    const formatTime = (seconds: number | undefined) => {
        if (seconds === undefined) return '--:--:--';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleChange = (qKey: string, value: string) => {
        setUserAnswers((prev: any) => ({ ...prev, [qKey]: value }));
    };

    const handleSubmit = () => {
        setSubmitted(true);
    };

    if (loading) {
        return <Center style={{ height: '60vh' }}><Loader /></Center>;
    }
    if (error) {
        return <Center style={{ height: '60vh' }}><Text color="red">{error}</Text></Center>;
    }
    if (!exam) {
        return <Center style={{ height: '60vh' }}><Text>Không tìm thấy dữ liệu bài thi.</Text></Center>;
    }

    const handleReadingPart2DragEnd = (result: DropResult, idx: number) => {
        const { source, destination } = result;
        if (!destination) return;
        const dndKey = `r2_dnd_${idx}`;
        const topic = exam.part2[idx];
        const allKeys = topic.sentences.filter((s: any) => !s.is_example_first).map((s: any) => String(s.key));
        const prevOrder = userAnswers[dndKey] ?? allKeys;
        const keyOrder = prevOrder.filter((k: string) => allKeys.includes(k));
        const newOrder = [...keyOrder];
        const [removed] = newOrder.splice(source.index, 1);
        newOrder.splice(destination.index, 0, removed);
        setUserAnswers((prev: any) => ({
            ...prev,
            [dndKey]: newOrder,
        }));
    };

    const renderReadingPart1 = () => (
        <Paper withBorder p="md" mb="md">
            <Title order={3} mb="sm">Part 1</Title>
            <Stack gap="md">
                {Array.isArray(exam.part1) && exam.part1.length > 0 ? (
                    exam.part1.map((group: any, gIdx: number) => (
                        <Paper key={gIdx} withBorder p="md">
                            <Title order={4}>Group {group.group}</Title>
                            {group.questions.map((q: any, qIdx: number) => {
                                const qKey = `r1_g${gIdx}_q${qIdx}`;
                                const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                                return (
                                    <div key={qKey} style={{ marginBottom: 16 }}>
                                        <Text fw={500}>{q.sentence}</Text>
                                        <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                                            {q.options.map((opt: string, i: number) => {
                                                const isCorrect = opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                                                return <Radio key={i} value={opt} checked={userAnswers[qKey] === opt} onChange={() => handleChange(qKey, opt)} label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>} />;
                                            })}
                                        </Group>
                                        {submitted && (<Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>{correct ? 'Đúng' : `Sai. Đáp án: ${q.correct_answer}`}</Text>)}
                                    </div>
                                );
                            })}
                        </Paper>
                    ))
                ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
            </Stack>
        </Paper>
    );

    const renderReadingPart2 = () => (
        <Paper withBorder p="md" mb="md">
            <Title order={3} mb="sm">Part 2</Title>
            <Stack gap="md">
                {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
                    exam.part2.map((topic: any, idx: number) => {
                        const sentences = Array.isArray(topic.sentences)
                            ? topic.sentences.filter((s: any) => !s.is_example_first)
                            : [];
                        const exampleSentence = Array.isArray(topic.sentences)
                            ? topic.sentences.find((s: any) => s.is_example_first)
                            : null;
                        const dndKey = `r2_dnd_${idx}`;
                        const allKeys = sentences.map((s: any) => String(s.key));
                        const currentOrder = userAnswers[dndKey] ?? allKeys;
                        let orderedSentences = currentOrder.map((k: string) => sentences.find((s: any) => String(s.key) === k));
                        if (orderedSentences.some((s: any) => !s)) {
                            orderedSentences = sentences;
                        }
                        const correctOrder = [...sentences].sort((a, b) => a.key - b.key);
                        let totalCorrect = 0;
                        for (let i = 0; i < orderedSentences.length; i++) {
                            if (orderedSentences[i]?.key === correctOrder[i]?.key) totalCorrect++;
                        }
                        return (
                            <Paper key={idx} withBorder p="md">
                                <Title order={4}>{topic.topic}</Title>
                                {exampleSentence && (
                                    <Text mb={8}>
                                        <b>Example.</b> {exampleSentence.text}
                                        <span style={{ marginLeft: 8, color: 'blue' }}>(0)</span>
                                    </Text>
                                )}
                                <DragDropContext onDragEnd={result => handleReadingPart2DragEnd(result, idx)}>
                                    <Droppable droppableId={`droppable-${idx}`} isDropDisabled={submitted}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                                {orderedSentences.map((s: any, sIdx: number) => {
                                                    let borderColor = '#dee2e6';
                                                    if (submitted) {
                                                        const correctIdx = correctOrder.findIndex((ss: any) => ss.key === s.key);
                                                        borderColor = (sIdx === correctIdx) ? 'green' : 'red';
                                                    }
                                                    return (
                                                        <Draggable key={s.key} draggableId={String(s.key)} index={sIdx} isDragDisabled={submitted}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{
                                                                        userSelect: 'none',
                                                                        padding: 16,
                                                                        margin: '0 0 8px 0',
                                                                        background: snapshot.isDragging ? '#e7f5ff' : '#fff',
                                                                        border: `2px solid ${borderColor}`,
                                                                        borderRadius: 6,
                                                                        ...provided.draggableProps.style
                                                                    }}
                                                                >
                                                                    <Text fw={500}>{s.text}</Text>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </Paper>
                        );
                    })
                ) : (
                    <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
                )}
            </Stack>
        </Paper>
    );

    const renderReadingPart3 = () => (
        <Paper withBorder p="md" mb="md">
            <Title order={3} mb="sm">Part 3</Title>
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
                                    const options = [
                                        { value: 'Person_A', label: 'Person A' },
                                        { value: 'Person_B', label: 'Person B' },
                                        { value: 'Person_C', label: 'Person C' },
                                        { value: 'Person_D', label: 'Person D' },
                                    ];
                                    return (
                                        <div key={qKey} style={{ marginBottom: 16 }}>
                                            <Text fw={500}>{q.text}</Text>
                                            <Select
                                                data={options}
                                                value={userAnswers[qKey] || ''}
                                                onChange={val => handleChange(qKey, val || '')}
                                                placeholder="Chọn đáp án"
                                                disabled={submitted}
                                                error={submitted && !correct}
                                                style={{ width: 180, marginTop: 4 }}
                                            />
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
                ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
            </Stack>
        </Paper>
    );

    const renderReadingPart4 = () => (
        <Paper withBorder p="md" mb="md">
            <Title order={3} mb="sm">Part 4</Title>
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
                                        <Select data={item.options.map((opt: string, i: number) => ({ value: String(i), label: opt }))} value={userAnswers[qKey] || ''} onChange={val => handleChange(qKey, val || '')} placeholder="Chọn đáp án" disabled={submitted} />
                                        {submitted && (<Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>{correct ? 'Đúng' : `Sai. Đáp án: ${item.options[correctIdx]}`}</Text>)}
                                    </div>
                                );
                            })}
                        </Paper>
                    ))
                ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
            </Stack>
        </Paper>
    );

    const renderPart1 = () => (
        <Paper withBorder p="md" mb="md">
            <Title order={3} mb="sm">Part 1</Title>
            <Stack gap="md">
                {Array.isArray(exam.part1) && exam.part1.length > 0 ? (
                    exam.part1[0]?.questions
                        ? exam.part1.map((group: any, gIdx: number) => (
                            <Paper key={gIdx} withBorder p="md">
                                <Title order={4}>Group {group.group}</Title>
                                {group.questions.map((q: any, qIdx: number) => {
                                    const qKey = `g${gIdx}_q${qIdx}`;
                                    const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                                    return (
                                        <div key={qKey} style={{ marginBottom: 16 }}>
                                            <Text fw={500}>{q.sentence}</Text>
                                            {q.audio_link && <AudioPlayer audioPath={q.audio_link} />}
                                            {q.options ? (
                                                <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                                                    {q.options.map((opt: string, i: number) => {
                                                        const correctIdx = Number(q.correct_answer) - 1;
                                                        const isCorrect = i === correctIdx;
                                                        return (<div key={i} style={{ background: 'transparent', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center' }}><Radio value={opt} checked={userAnswers[qKey] === opt} onChange={() => handleChange(qKey, opt)} label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>} /></div>);
                                                    })}
                                                </Group>
                                            ) : (<TextInput value={userAnswers[qKey] || ''} onChange={e => handleChange(qKey, e.target.value)} disabled={submitted} placeholder="Nhập đáp án" mt={4} error={submitted && !correct} />)}
                                            {submitted && (<Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>{correct ? 'Đúng' : `Sai`}</Text>)}
                                        </div>
                                    );
                                })}
                            </Paper>
                        ))
                        : exam.part1.map((q: any, qIdx: number) => {
                            const qKey = `q${qIdx}`;
                            const correctIdx = Number(q.correct_answer) - 1;
                            const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === (q.options && q.options[correctIdx] ? q.options[correctIdx].trim().toLowerCase() : (q.correct_answer + '').trim().toLowerCase());
                            return (
                                <Paper key={qKey} withBorder p="md">
                                    <Text fw={500}>{q.question}</Text>
                                    {q.audio_link && <AudioPlayer audioPath={q.audio_link} />}
                                    {q.options ? (
                                        <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                                            {q.options.map((opt: string, i: number) => {
                                                const correctIdx = Number(q.correct_answer) - 1;
                                                const isCorrect = i === correctIdx;
                                                return (<div key={i} style={{ background: 'transparent', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center' }}><Radio value={opt} label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>} /></div>);
                                            })}
                                        </Group>
                                    ) : (<TextInput value={userAnswers[qKey] || ''} onChange={e => handleChange(qKey, e.target.value)} disabled={submitted} placeholder="Nhập đáp án" mt={4} error={submitted && !correct} />)}
                                    {submitted && (<Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>{correct ? 'Đúng' : `Sai`}</Text>)}
                                </Paper>
                            );
                        })
                ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
            </Stack>
        </Paper>
    );

    const renderPart2 = () => (
        <Paper withBorder p="md" mb="md">
            <Title order={3} mb="sm">Part 2</Title>
            <Stack gap="md">
                {Array.isArray(exam.part2) && exam.part2.length > 0 ? (
                    exam.part2.map((item: any, idx: number) => (
                        <Paper key={idx} withBorder p="md">
                            <Title order={4}>{item.topic}</Title>
                            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
                            <div>
                                {['a', 'b', 'c', 'd'].map((key, i) => {
                                    const personLabel = String.fromCharCode(65 + i); // A, B, C, D
                                    const answerKey = `p2_${idx}_${i}`;
                                    const userValue = userPart2Answers[answerKey] || '';
                                    const correctIdx = item[key] - 1;
                                    const correctOption = item.options && correctIdx >= 0 ? item.options[correctIdx] : '';
                                    const correct = submitted && userValue && userValue === correctOption;
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                            <span style={{ width: 32, fontWeight: 'bold' }}>{personLabel}</span>
                                            <Select data={item.options.map((opt: string) => ({ value: opt, label: opt }))} value={userValue} onChange={val => setUserPart2Answers((prev: any) => ({ ...prev, [answerKey]: val }))} placeholder="Chọn đáp án" disabled={submitted} style={{ width: 220, marginLeft: 8 }} error={submitted && !correct} />
                                            {submitted && !correct && (<Text fw='bold' size="sm" color="green" ml={12}>Đáp án: {correctOption}</Text>)}
                                            {submitted && correct && (<Text size="sm" color="green" ml={12}>Đúng</Text>)}
                                        </div>
                                    );
                                })}
                            </div>
                        </Paper>
                    ))
                ) : (<Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>)}
            </Stack>
        </Paper>
    );

    const renderPart3 = () => (
        <Paper withBorder p="md" mb="md">
            <Title order={3} mb="sm">Part 3</Title>
            <Stack gap="md">
                {Array.isArray(exam.part3) && exam.part3.length > 0 ? (
                    exam.part3.map((item: any, idx: number) => (
                        <Paper key={idx} withBorder p="md">
                            <Title order={4}>{item.topic}</Title>
                            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
                            {item.questions && item.questions.map((q: string, qIdx: number) => {
                                const qKey = `p3_${idx}_${qIdx}`;
                                const correct = submitted && userAnswers[qKey]?.trim().toLowerCase() === (item.correct_answers && item.correct_answers[qIdx] ? item.correct_answers[qIdx].trim().toLowerCase() : '');
                                return (
                                    <div key={qKey} style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                                        <Text fw={500} style={{ marginRight: 16 }}>{q}</Text>
                                        <Select data={['MAN', 'WOMAN', 'BOTH']} value={userAnswers[qKey] || ''} onChange={val => handleChange(qKey, val || '')} placeholder="Chọn đáp án" disabled={submitted} style={{ width: 120, marginLeft: 8 }} error={submitted && !correct} />
                                        {submitted && !correct && (<Text fw='bold' size="sm" color="green" ml={12}>Đáp án: {item.correct_answers ? item.correct_answers[qIdx] : ''}</Text>)}
                                        {submitted && correct && (<Text size="sm" color="green" ml={12}>Đúng</Text>)}
                                    </div>
                                );
                            })}
                        </Paper>
                    ))
                ) : <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>}
            </Stack>
        </Paper>
    );

    const renderPart4 = () => {
        // Nhóm các item theo topic
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
                        Object.entries(topicMap).map(([topic, items], idx) => {
                            // Lấy audio đầu tiên của topic (nếu có)
                            const audio_link = items[0].audio_link;
                            // Gom tất cả câu hỏi và options
                            const allQuestions: { q: string, options: string[], correctIdx: number, qKey: string }[] = [];
                            items.forEach((item: any, itemIdx: number) => {
                                if (item.questions && item.options && item.correct_answers) {
                                    item.questions.forEach((q: string, qIdx: number) => {
                                        const qKey = `p4_${itemIdx}_${qIdx}`;
                                        const correctIdx = item.correct_answers && item.correct_answers[qIdx] ? Number(item.correct_answers[qIdx]) - 1 : -1;
                                        allQuestions.push({
                                            q,
                                            options: item.options[qIdx],
                                            correctIdx,
                                            qKey
                                        });
                                    });
                                }
                            });
                            return (
                                <Paper key={topic} withBorder p="md">
                                    <Title order={4}>{topic}</Title>
                                    {audio_link && <AudioPlayer audioPath={audio_link} />}
                                    {allQuestions.map((qObj, qIdx) => {
                                        const correct = submitted && userAnswers[qObj.qKey]?.trim().toLowerCase() === (qObj.options && qObj.options[qObj.correctIdx] ? qObj.options[qObj.correctIdx].trim().toLowerCase() : '');
                                        return (
                                            <div key={qObj.qKey} style={{ marginBottom: 16 }}>
                                                <Text fw={500}>{qObj.q}</Text>
                                                {qObj.options ? (
                                                    <Group gap={12} mt={4} style={submitted ? { pointerEvents: 'none' } : {}}>
                                                        {qObj.options.map((opt: string, i: number) => {
                                                            const isCorrect = i === qObj.correctIdx;
                                                            return (
                                                                <div key={i} style={{ background: 'transparent', borderRadius: 6, padding: '2px 8px', display: 'flex', alignItems: 'center' }}>
                                                                    <Radio value={opt} label={<span style={{ fontWeight: submitted && isCorrect ? 'bold' : undefined }}>{opt}</span>} />
                                                                </div>
                                                            );
                                                        })}
                                                    </Group>
                                                ) : null}
                                                {submitted && (<Text fw='bold' size="sm" color={correct ? 'green' : 'red'} mt={4}>{correct ? 'Đúng' : 'Sai'}</Text>)}
                                            </div>
                                        );
                                    })}
                                </Paper>
                            );
                        })
                    ) : (
                        <Text color="red">Bài thi này chưa hỗ trợ giao diện làm bài.</Text>
                    )}
                </Stack>
            </Paper>
        );
    };

    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Title order={2} mb="lg">Làm bài: {exam?.title}</Title>
            {/* Hiển thị Note cho phần Listening */}
            {partType === 'listening' && (
                <Text color="red" fw={700} mb="md" style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Lưu ý: Ở bài thi, mỗi câu hỏi chỉ được nghe tối đa 2 lần!!!
                </Text>
            )}
            {!submitted && remainingTime !== undefined && (
                <Text size='lg' color='red' mb='md' fw='bold'>
                    Thời gian còn lại: {formatTime(remainingTime)}
                </Text>
            )}
            {submitted && (
                <Text size="lg" color="blue" mb="md" fw="bold">
                    Kết quả: {correctCount}/{totalQuestions} câu đúng
                </Text>
            )}
            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                {partType === 'reading' ? (
                    <>
                        {renderReadingPart1()}
                        {renderReadingPart2()}
                        {renderReadingPart3()}
                        {renderReadingPart4()}
                    </>
                ) : (
                    <>
                        {renderPart1()}
                        {renderPart2()}
                        {renderPart3()}
                        {renderPart4()}
                    </>
                )}
                <Group mt="xl">
                    <Button type="submit" disabled={submitted}>Nộp bài</Button>
                    <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
                </Group>
            </form>
        </Paper>
    );
};

export default TakeExamPart; 