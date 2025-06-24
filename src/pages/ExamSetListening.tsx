import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Paper,
    Title,
    Text,
    Button,
    Group,
    Loader,
    Center,
    Stack,
    FileInput,
    TextInput,
    NumberInput,
    Grid,
    MantineTheme,
    Accordion,
    Box,
    Select,
} from '@mantine/core';
import { IconUpload, IconPlayerPlay } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { examSetService } from '../services/examSetService';
import { ExamSet, CreateReadingExamPartDto, Exam, ExamPartDetail } from '../types/examSet';

// Component phát audio từ audio_link
function AudioPlayer({ audioPath }: { audioPath: string }) {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handlePlay = async () => {
        setLoading(true);
        try {
            const base64 = await examSetService.getAudioBase64(audioPath);
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

const ExamSetListening: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [examSet, setExamSet] = useState<ExamSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [examPartCode, setExamPartCode] = useState('');
    const [titleForPart, setTitleForPart] = useState('');
    const [timeLimitMinutesForPart, setTimeLimitMinutesForPart] = useState<number | ''>(0);
    const [examPartDetail, setExamPartDetail] = useState<ExamPartDetail | null>(null);
    const [existingListeningExam, setExistingListeningExam] = useState<Exam | null>(null);

    const horizontalInputStyles = (theme: MantineTheme) => ({
        root: {
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        label: {
            textAlign: 'right' as const,
        },
    });

    const loadData = useCallback(async () => {
        if (!id) {
            setError('Exam Set ID is missing.');
            return;
        }
        setLoading(true);
        setExamSet(null);
        setExamPartDetail(null);
        setExamPartCode('');
        setTitleForPart('');
        setTimeLimitMinutesForPart(0);
        setError(null);
        setExistingListeningExam(null);
        try {
            const examSetData = await examSetService.getById(Number(id));
            setExamSet(examSetData);
            const foundExam = examSetData.exams?.find(exam => exam.exam_type === 'listening');
            setExistingListeningExam(foundExam || null);
            if (foundExam) {
                setExamPartCode(foundExam.exam_code || '');
                setTitleForPart(foundExam.description || '');
                setTimeLimitMinutesForPart(foundExam.time_limit || 0);
                try {
                    const examPartData = await examSetService.getExamPartDetail(foundExam.id);
                    setExamPartDetail(examPartData);
                } catch (partError) {
                    setExamPartDetail(null);
                }
            } else {
                setExamPartDetail(null);
            }
        } catch (error) {
            setError('Failed to load exam set details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFileUpload = async () => {
        if (!file) {
            showNotification({
                title: 'Validation Error',
                message: 'Please select a file to upload.',
                color: 'red',
            });
            return;
        }
        if (!examSet) {
            setError('Exam Set not loaded.');
            return;
        }
        try {
            if (existingListeningExam) {
                // Update existing exam part - time limit is not updated here, so no check needed
                // Bạn cần có hàm updateListeningExamFile nếu muốn update file
                // await examSetService.updateListeningExamFile(existingListeningExam.id, file);
                showNotification({
                    title: 'Not implemented',
                    message: 'Update file for listening chưa được implement.',
                    color: 'yellow',
                });
            } else {
                // Create new exam part
                if (!examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0) {
                    showNotification({
                        title: 'Validation Error',
                        message: 'Please fill in all required fields. Time limit must be greater than 0.',
                        color: 'red',
                    });
                    return;
                }
                const data: CreateReadingExamPartDto = {
                    exam_part_code: examPartCode,
                    title_for_part: titleForPart,
                    time_limit_minutes_for_part: timeLimitMinutesForPart as number,
                    file: file,
                };
                await examSetService.uploadListeningExamPart(examSet.id, data);
            }
            loadData();
            setFile(null);
        } catch (err) {
            showNotification({
                title: 'Error',
                message: 'Failed to upload listening exam part.',
                color: 'red',
            });
        }
    };

    const isUploadDisabled = existingListeningExam
        ? !file
        : !file || !examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0;

    const renderPart1 = (part1: any[]) => {
        if (!Array.isArray(part1)) return null;
        return (
            <Accordion>
                {part1.map((item, idx) => (
                    <Accordion.Item key={idx} value={`p1-${idx}`}>
                        <Accordion.Control>
                            {item.question}
                        </Accordion.Control>
                        <Accordion.Panel>
                            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
                            <div>
                                {item.options && item.options.map((opt: string, i: number) => {
                                    const isCorrect = String(i + 1) === String(item.correct_answer);
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: 4,
                                                borderRadius: 4,
                                                padding: '2px 8px'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: isCorrect ? 'bold' : undefined,
                                                    color: isCorrect ? 'green' : undefined,
                                                    marginRight: 8,
                                                    minWidth: 18,
                                                    display: 'inline-block'
                                                }}
                                            >
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span style={{ color: isCorrect ? 'green' : undefined, fontWeight: isCorrect ? 'bold' : undefined }}>{opt}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        );
    };

    const renderPart2 = (part2: any[]) => {
        if (!Array.isArray(part2)) return null;
        const personKeys = ['a', 'b', 'c', 'd'];
        const personLabels = ['A', 'B', 'C', 'D'];
        return (
            <Accordion>
                {part2.map((item, idx) => (
                    <Accordion.Item key={idx} value={`p2-${idx}`}>
                        <Accordion.Control>{item.topic}</Accordion.Control>
                        <Accordion.Panel>
                            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
                            <div>
                                {item.options && item.options.map((opt: string, i: number) => {
                                    // Tìm những người chọn option này
                                    const answerers = personKeys
                                        .map((key, idx) => (item[key] === i + 1 ? personLabels[idx] : null))
                                        .filter(Boolean);
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: 4,
                                                borderRadius: 4,
                                                padding: '2px 8px'
                                            }}
                                        >
                                            <span>{opt}</span>
                                            {answerers.length > 0 && (
                                                <span style={{ marginLeft: 12, color: 'green', fontWeight: 'bold' }}>
                                                    Đáp án: {answerers.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        );
    };

    const renderPart3 = (part3: any[]) => {
        if (!Array.isArray(part3)) return null;
        return (
            <Accordion>
                {part3.map((item, idx) => (
                    <Accordion.Item key={idx} value={`p3-${idx}`}>
                        <Accordion.Control>{item.topic}</Accordion.Control>
                        <Accordion.Panel>
                            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
                            {item.questions && item.questions.map((q: string, i: number) => (
                                <div key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', marginRight: 8 }}>{`Câu ${i + 1}:`}</span>
                                    <span style={{ marginRight: 16 }}>{q}</span>
                                    <Select
                                        data={['MAN', 'WOMAN', 'BOTH']}
                                        value={item.correct_answers && item.correct_answers[i] ? item.correct_answers[i] : ''}
                                        readOnly
                                        style={{ width: 120, marginLeft: 8, color: 'green', fontWeight: 'bold' }}
                                    />
                                </div>
                            ))}
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        );
    };

    const renderPart4 = (part4: any[]) => {
        if (!Array.isArray(part4)) return null;
        return (
            <Accordion>
                {part4.map((item, idx) => (
                    <Accordion.Item key={idx} value={`p4-${idx}`}>
                        <Accordion.Control>{item.topic}</Accordion.Control>
                        <Accordion.Panel>
                            {item.audio_link && <AudioPlayer audioPath={item.audio_link} />}
                            {item.questions && item.questions.map((q: string, qIdx: number) => (
                                <div key={qIdx} style={{ marginBottom: 8 }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{q}</div>
                                    {item.options && item.options[qIdx] && item.options[qIdx].map((opt: string, i: number) => {
                                        const isCorrect = item.correct_answers && String(i + 1) === String(item.correct_answers[qIdx]);
                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: 4,
                                                    borderRadius: 4,
                                                    padding: '2px 8px'
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: isCorrect ? 'bold' : undefined,
                                                        color: isCorrect ? 'green' : undefined,
                                                        marginRight: 8,
                                                        minWidth: 18,
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    {String.fromCharCode(65 + i)}
                                                </span>
                                                <span style={{ color: isCorrect ? 'green' : undefined, fontWeight: isCorrect ? 'bold' : undefined }}>{opt}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        );
    };

    if (loading) {
        return (
            <Center style={{ height: 'calc(100vh - 60px)' }}>
                <Loader />
            </Center>
        );
    }
    if (error) {
        return (
            <Center style={{ height: 'calc(100vh - 60px)' }}>
                <Text color="red">Error: {error}</Text>
            </Center>
        );
    }
    if (!examSet) {
        return (
            <Center style={{ height: 'calc(100vh - 60px)' }}>
                <Text>Exam Set not found.</Text>
            </Center>
        );
    }
    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Group justify="space-between" mb="xl">
                <Title order={2} c="indigo.7">Exam Set Listening: {examSet?.title || 'Loading...'}</Title>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Back to Exam Set Detail
                </Button>
            </Group>
            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    {examSet && (
                        <Paper withBorder p="md" mb="xl" style={{ height: '100%' }}>
                            <Title order={3} mb="md">Exam Set Details</Title>
                            <Stack gap="sm">
                                <Text><strong>Set Code:</strong> {examSet.set_code}</Text>
                                <Text><strong>Title:</strong> {examSet.title}</Text>
                                {examSet.created_at && <Text><strong>Created At:</strong> {new Date(examSet.created_at).toLocaleString()}</Text>}
                                {examSet.updated_at && <Text><strong>Last Updated:</strong> {new Date(examSet.updated_at).toLocaleString()}</Text>}
                            </Stack>
                        </Paper>
                    )}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" mb="xl" style={{ height: '100%' }}>
                        <Title order={3} mb="md">{existingListeningExam ? 'Update Listening Part File' : 'Upload New Listening Part'}</Title>
                        <Stack mb="md" gap="md">
                            <TextInput
                                label="Exam Part Code"
                                placeholder="Enter unique code"
                                value={examPartCode}
                                onChange={(e) => setExamPartCode(e.target.value)}
                                required
                                disabled={!!existingListeningExam}
                                styles={horizontalInputStyles}
                            />
                            <TextInput
                                label="Title for Part"
                                placeholder="Enter title for this part"
                                value={titleForPart}
                                onChange={(e) => setTitleForPart(e.target.value)}
                                required
                                disabled={!!existingListeningExam}
                                styles={horizontalInputStyles}
                            />
                            <NumberInput
                                label="Time Limit (minutes)"
                                placeholder="Enter time limit"
                                value={timeLimitMinutesForPart}
                                onChange={(value) => setTimeLimitMinutesForPart(value as number | '')}
                                required
                                min={0}
                                disabled={!!existingListeningExam}
                                styles={horizontalInputStyles}
                            />
                            <FileInput
                                label="Upload File"
                                placeholder={existingListeningExam ? 'Upload a new Excel (.xlsx) file to update' : 'Upload Excel (.xlsx) file'}
                                value={file}
                                onChange={setFile}
                                leftSection={<IconUpload size={16} />}
                                required
                                styles={horizontalInputStyles}
                            />
                            <Button onClick={handleFileUpload} disabled={isUploadDisabled} color="blue">
                                {existingListeningExam ? 'Update File' : 'Upload Listening Part'}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>
            {examPartDetail && (
                <Paper mt="xl" p="md" withBorder>
                    <Title order={3} mb="md">Listening Content</Title>
                    <Stack gap="xl">
                        {(examPartDetail.part1 || examPartDetail.part2 || examPartDetail.part3 || examPartDetail.part4) ? (
                            <>
                                {examPartDetail.part1 && (
                                    <Box>
                                        <Title order={4} mb="md">Part 1</Title>
                                        {renderPart1(examPartDetail.part1)}
                                    </Box>
                                )}
                                {examPartDetail.part2 && (
                                    <Box>
                                        <Title order={4} mb="md">Part 2</Title>
                                        {renderPart2(examPartDetail.part2)}
                                    </Box>
                                )}
                                {examPartDetail.part3 && (
                                    <Box>
                                        <Title order={4} mb="md">Part 3</Title>
                                        {renderPart3(examPartDetail.part3)}
                                    </Box>
                                )}
                                {examPartDetail.part4 && (
                                    <Box>
                                        <Title order={4} mb="md">Part 4</Title>
                                        {renderPart4(examPartDetail.part4)}
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Text>No listening content available for this exam part.</Text>
                        )}
                    </Stack>
                </Paper>
            )}
        </Paper>
    );
};

export default ExamSetListening; 