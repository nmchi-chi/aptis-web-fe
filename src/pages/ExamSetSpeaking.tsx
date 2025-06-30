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
    Box,
    Image,
    MantineTheme,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { examSetService } from '../services/examSetService';
import { ExamSet, CreateReadingExamPartDto, Exam, ExamPartDetail } from '../types/examSet';

// Component hiển thị ảnh từ image_url
function ImageViewer({ imagePath, alt }: { imagePath: string; alt: string }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLoadImage = useCallback(async () => {
        setLoading(true);
        try {
            // Check if it's a Google Drive URL
            if (imagePath.includes('drive.google.com')) {
                const directUrl = await examSetService.getGoogleDriveAudioUrl(imagePath);
                setImageUrl(directUrl);
            } else {
                // Use API for server paths
                const base64 = await examSetService.getAudioBase64(imagePath);
                if (base64) setImageUrl(`data:image/jpeg;base64,${base64}`);
            }
        } finally {
            setLoading(false);
        }
    }, [imagePath]);

    useEffect(() => {
        if (imagePath) {
            handleLoadImage();
        }
    }, [imagePath, handleLoadImage]);

    if (loading) {
        return <Loader size="sm" />;
    }

    if (!imageUrl) {
        return <Text size="sm" c="dimmed">Image not available</Text>;
    }

    return (
        <Image
            src={imageUrl}
            alt={alt}
            style={{ maxWidth: '300px', maxHeight: '200px' }}
            radius="md"
        />
    );
}

const ExamSetSpeaking: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [examSet, setExamSet] = useState<ExamSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [speakingExam, setSpeakingExam] = useState<Exam | null>(null);
    const [examPartDetail, setExamPartDetail] = useState<ExamPartDetail | null>(null);

    // Form states for creating new speaking exam
    const [examPartCode, setExamPartCode] = useState('');
    const [titleForPart, setTitleForPart] = useState('');
    const [timeLimitMinutesForPart, setTimeLimitMinutesForPart] = useState<number | string>('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const horizontalInputStyles = (theme: MantineTheme) => ({
        root: {
            display: 'grid',
            gridTemplateColumns: '150px 1fr', // Fixed label width, flexible input width
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        label: {
            margin: 0,
        },
    });

    const loadExamSet = useCallback(async () => {
        if (!id) {
            setError('Exam Set ID is missing.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await examSetService.getById(Number(id));
            setExamSet(data);

            // Find existing speaking exam
            const existingSpeakingExam = data.exams?.find((exam: Exam) => exam.exam_type === 'speaking');
            setSpeakingExam(existingSpeakingExam || null);

            // Load exam part detail if speaking exam exists
            if (existingSpeakingExam) {
                try {
                    const examDetail = await examSetService.getExamPartDetail(existingSpeakingExam.id);
                    setExamPartDetail(examDetail);
                } catch (err) {
                    console.error('Error loading speaking exam detail:', err);
                }
            }
        } catch (err) {
            console.error('Error loading exam set details:', err);
            setError('Failed to load exam set details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadExamSet();
    }, [loadExamSet]);

    // Populate form fields when speakingExam is loaded
    useEffect(() => {
        if (speakingExam) {
            setExamPartCode(speakingExam.exam_code || '');
            setTitleForPart(speakingExam.description || '');
            setTimeLimitMinutesForPart(speakingExam.time_limit || '');
        }
    }, [speakingExam]);

    const isUploadDisabled = speakingExam
        ? !file
        : !file || !examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0;

    const handleCreateSpeakingExam = async () => {
        if (!examPartCode || !titleForPart || timeLimitMinutesForPart === '' || timeLimitMinutesForPart === 0 || !file) {
            showNotification({
                title: 'Validation Error',
                message: 'Please fill in all required fields and select an Excel file. Time limit must be greater than 0.',
                color: 'red',
            });
            return;
        }

        try {
            setUploading(true);
            const data: CreateReadingExamPartDto = {
                exam_part_code: examPartCode,
                title_for_part: titleForPart,
                time_limit_minutes_for_part: timeLimitMinutesForPart as number,
                file: file,
            };

            await examSetService.createSpeakingExamPart(Number(id), data);
            showNotification({
                title: 'Success',
                message: 'Speaking exam created successfully!',
                color: 'green',
            });

            // Reset form
            setExamPartCode('');
            setTitleForPart('');
            setTimeLimitMinutesForPart('');
            setFile(null);

            // Reload data
            await loadExamSet();
        } catch (error) {
            console.error('Error creating speaking exam:', error);
            showNotification({
                title: 'Error',
                message: 'Failed to create speaking exam. Please try again.',
                color: 'red',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateSpeakingExam = async () => {
        if (!file || !speakingExam) {
            showNotification({
                title: 'Validation Error',
                message: 'Please select an Excel file to update.',
                color: 'red',
            });
            return;
        }

        try {
            setUploading(true);
            await examSetService.updateSpeakingExamFile(speakingExam.id, file);
            showNotification({
                title: 'Success',
                message: 'Speaking exam updated successfully!',
                color: 'green',
            });

            // Reset file
            setFile(null);

            // Reload data
            await loadExamSet();
        } catch (error) {
            console.error('Error updating speaking exam:', error);
            showNotification({
                title: 'Error',
                message: 'Failed to update speaking exam. Please try again.',
                color: 'red',
            });
        } finally {
            setUploading(false);
        }
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
                <Text c="red">Error: {error}</Text>
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

    const renderSpeakingExamContent = () => {
        if (!examPartDetail) return <Text c="dimmed">No speaking exam content available.</Text>;

        // Check if examPartDetail has speaking parts data
        const speakingParts = examPartDetail as any; // Cast to access dynamic properties

        if (!speakingParts || typeof speakingParts !== 'object') {
            return <Text c="dimmed">No speaking exam content available.</Text>;
        }

        // Get all parts (0, 1, 2, 3 corresponding to Part 1, 2, 3, 4)
        const parts = Object.keys(speakingParts)
            .filter(key => !isNaN(Number(key)))
            .map(key => ({ key: Number(key), data: speakingParts[key] }))
            .sort((a, b) => a.key - b.key);

        if (parts.length === 0) {
            return <Text c="dimmed">No speaking parts found.</Text>;
        }

        return (
            <Stack gap="xl">
                {parts.map(({ key, data }) => (
                    <Paper key={key} withBorder p="md">
                        <Title order={4} mb="md">
                            Part {data.part}: {data.topic}
                        </Title>
                        <Stack gap="md">
                            {/* Instruction */}
                            <Box>
                                <Text fw={500} mb="xs">Instructions:</Text>
                                <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                                    {data.instruction}
                                </Text>
                            </Box>

                            {/* Images */}
                            {(data.image_url_1 || data.image_url_2) && (
                                <Box>
                                    <Text fw={500} mb="xs">Images:</Text>
                                    <Group gap="md">
                                        {data.image_url_1 && (
                                            <Box>
                                                <ImageViewer imagePath={data.image_url_1} alt={`Part ${data.part} Image 1`} />
                                            </Box>
                                        )}
                                        {data.image_url_2 && (
                                            <Box>
                                                <ImageViewer imagePath={data.image_url_2} alt={`Part ${data.part} Image 2`} />
                                            </Box>
                                        )}
                                    </Group>
                                </Box>
                            )}

                            {/* Questions */}
                            {data.question && Array.isArray(data.question) && (
                                <Box>
                                    <Text fw={500} mb="xs">Questions:</Text>
                                    <Stack gap="xs">
                                        {data.question.map((q: any, idx: number) => (
                                            <Box key={idx} mb="xs">
                                                <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                                                    <Text component="span" fw={500}>Q{idx + 1}:</Text> {q.text || q}
                                                </Text>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                ))}
            </Stack>
        );
    };

    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Group justify="space-between" mb="xl">
                <Title order={2} c="orange.7">Exam Set Speaking: {examSet?.title || 'Loading...'}</Title>
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
                                {examSet.updated_at && <Text><strong>Updated At:</strong> {new Date(examSet.updated_at).toLocaleString()}</Text>}
                            </Stack>
                        </Paper>
                    )}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" mb="xl">
                        <Title order={3} mb="md">
                            {speakingExam ? 'Update Speaking Exam' : 'Create Speaking Exam'}
                        </Title>
                        <Stack gap="md">
                            <TextInput
                                label="Exam Part Code"
                                placeholder="Enter unique code"
                                value={examPartCode}
                                onChange={(e) => setExamPartCode(e.target.value)}
                                required
                                disabled={!!speakingExam}
                                styles={horizontalInputStyles}
                            />
                            <TextInput
                                label="Title for Part"
                                placeholder="Enter title for this part"
                                value={titleForPart}
                                onChange={(e) => setTitleForPart(e.target.value)}
                                required
                                disabled={!!speakingExam}
                                styles={horizontalInputStyles}
                            />
                            <NumberInput
                                label="Time Limit (minutes)"
                                placeholder="Enter time limit"
                                value={timeLimitMinutesForPart}
                                onChange={setTimeLimitMinutesForPart}
                                min={1}
                                required
                                disabled={!!speakingExam}
                                styles={horizontalInputStyles}
                            />
                            <FileInput
                                label="Upload File"
                                placeholder={speakingExam ? 'Upload a new Excel (.xlsx) file to update' : 'Upload Excel (.xlsx) file'}
                                value={file}
                                onChange={setFile}
                                leftSection={<IconUpload size={16} />}
                                required
                                styles={horizontalInputStyles}
                            />
                            <Button
                                onClick={speakingExam ? handleUpdateSpeakingExam : handleCreateSpeakingExam}
                                loading={uploading}
                                disabled={isUploadDisabled}
                                color="orange"
                                fullWidth
                            >
                                {speakingExam ? 'Update Speaking Exam' : 'Create Speaking Exam'}
                            </Button>
                        </Stack>
                    </Paper>
                </Grid.Col>
            </Grid>

            {speakingExam && (
                <Paper withBorder p="md">
                    <Title order={3} mb="md">Speaking Exam Content</Title>
                    {renderSpeakingExamContent()}
                </Paper>
            )}
        </Paper>
    );
};

export default ExamSetSpeaking;
