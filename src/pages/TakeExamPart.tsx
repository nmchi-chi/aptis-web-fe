import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Loader, Center, Button, Text, Group } from '@mantine/core';
import { userExamService } from '../services/userExamService';
import { DropResult } from 'react-beautiful-dnd';
import ExamRenderer from '../components/exam/ExamRenderer';

const TakeExamPart: React.FC = () => {
    const { examSetId, partType } = useParams<{ examSetId: string; partType: string }>();
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<any>({});
    const [userPart2Answers, setUserPart2Answers] = useState<any>({});
    const [submitted, setSubmitted] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const navigate = useNavigate();

    // Load exam data
    useEffect(() => {
        const loadExam = async () => {
            if (!examSetId || !partType) return;

            try {
                setLoading(true);
                
                // First get the exam set details
                const examSetResponse = await userExamService.getUserExamSetDetail(Number(examSetId));
                console.log('Exam set response:', examSetResponse);
                
                // Find the exam with the matching part type
                const foundExam = examSetResponse.exams?.find((exam: any) => exam.exam_type === partType);
                console.log('Found exam:', foundExam);
                
                if (!foundExam) {
                    throw new Error(`Không tìm thấy phần thi ${partType} trong bộ đề này`);
                }
                
                // if (!foundExam.id) {
                //     console.error('Exam ID is null or undefined:', foundExam);
                //     throw new Error(`Exam ID is missing for ${partType} part`);
                // }

                console.log('Calling getUserExamPartDetail with ID:', foundExam.id);
                // Get the detailed exam content using the admin API endpoint
                const response = await userExamService.getUserExamDetail(5);
                console.log('Exam part detail response:', response);
                setExam(response);
                
                // Set timer if available
                if (response.time_limit) {
                    setRemainingTime(response.time_limit * 60);
                }
            } catch (err: any) {
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu bài thi');
            } finally {
                setLoading(false);
            }
        };

        loadExam();
    }, [examSetId, partType]);

    const handleSubmit = useCallback(() => {
        setSubmitted(true);
    }, []);

    // Timer countdown
    useEffect(() => {
        if (remainingTime === undefined || remainingTime <= 0 || submitted) return;

        const timer = setInterval(() => {
            setRemainingTime(prev => {
                if (prev === undefined || prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [remainingTime, submitted, handleSubmit]);

    // Calculate total questions
    useEffect(() => {
        if (!exam) return;
        
        let total = 0;
        if (Array.isArray(exam.part1)) {
            if (exam.part1[0]?.questions) {
                exam.part1.forEach((group: any) => {
                    if (Array.isArray(group.questions)) total += group.questions.length;
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
                        const correctPersons = personKeys.map((key, idx2) => (item[key] === i + 1 ? personLabels[idx2] : null)).filter(Boolean);
                        if (correctPersons.length > 0) total++;
                    });
                }
            });
        }
        setTotalQuestions(total);
    }, [exam, partType]);

    // Calculate correct answers
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
                    const dndKey = `r2_dnd_${idx}`;
                    const sentences = topic.sentences.filter((s: any) => !s.is_example_first);
                    const allKeys = sentences.map((s: any) => String(s.key));
                    const userOrder = userAnswers[dndKey] ?? allKeys; // Sử dụng thứ tự ban đầu nếu chưa kéo thả
                    const correctOrder = [...sentences].sort((a, b) => a.key - b.key);
                    userOrder.forEach((userKey: string, userIdx: number) => {
                        if (correctOrder[userIdx] && String(correctOrder[userIdx].key) === userKey) {
                            correct++;
                        }
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
            if (Array.isArray(exam.part1)) {
                if (exam.part1[0]?.questions) {
                    exam.part1.forEach((group: any, gIdx: number) => {
                        group.questions.forEach((q: any, qIdx: number) => {
                            const qKey = `r1_g${gIdx}_q${qIdx}`;
                            if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                        });
                    });
                } else {
                    exam.part1.forEach((q: any, qIdx: number) => {
                        const qKey = `p1_${qIdx}`;
                        if (userAnswers[qKey]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) correct++;
                    });
                }
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

    const handleChange = (qKey: string, value: string) => {
        setUserAnswers((prev: any) => ({ ...prev, [qKey]: value }));
    };

    const handlePart2AnswerChange = (qKey: string, value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] : value;
        setUserPart2Answers((prev: any) => ({ ...prev, [qKey]: stringValue }));
    };

    const handleDragEnd = (result: DropResult, topicIdx: number) => {
        const { source, destination } = result;
        if (!destination) return;
        const dndKey = `r2_dnd_${topicIdx}`;
        const topic = exam.part2[topicIdx];
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

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return <Center style={{ height: '60vh' }}><Loader /></Center>;
    }
    if (error) {
        return <Center style={{ height: '60vh' }}><Text c="red">{error}</Text></Center>;
    }
    if (!exam) {
        return <Center style={{ height: '60vh' }}><Text>Không tìm thấy dữ liệu bài thi.</Text></Center>;
    }

    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Title order={2} mb="lg">Làm bài: {exam?.title}</Title>
            {/* Hiển thị Note cho phần Listening */}
            {partType === 'listening' && (
                <Text c="red" fw={700} mb="md" style={{ fontSize: 18, fontWeight: 'bold' }}>
                    Lưu ý: Ở bài thi, mỗi câu hỏi chỉ được nghe tối đa 2 lần!!!
                </Text>
            )}
            {!submitted && remainingTime !== undefined && (
                <Text size='lg' c='red' mb='md' fw='bold'>
                    Thời gian còn lại: {formatTime(remainingTime)}
                </Text>
            )}
            {submitted && (
                <Text size="lg" c="blue" mb="md" fw="bold">
                    Kết quả: {correctCount}/{totalQuestions} câu đúng
                </Text>
            )}
            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                <ExamRenderer
                    partType={partType || ''}
                    exam={exam}
                    userAnswers={userAnswers}
                    userPart2Answers={userPart2Answers}
                    submitted={submitted}
                    onAnswerChange={handleChange}
                    onPart2AnswerChange={handlePart2AnswerChange}
                    onDragEnd={handleDragEnd}
                />
                <Group mt="xl">
                    <Button type="submit" disabled={submitted}>Nộp bài</Button>
                    <Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button>
                </Group>
            </form>
        </Paper>
    );
};

export default TakeExamPart;
