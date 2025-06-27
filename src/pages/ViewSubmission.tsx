import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Title, Text, Button, Group, Center, Loader } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { userExamService } from '../services/userExamService';
import ExamRenderer from '../components/exam/ExamRenderer';

const ViewSubmission: React.FC = () => {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [exam, setExam] = useState<any>(null);
    const [userAnswers, setUserAnswers] = useState<any>({});
    const [userPart2Answers, setUserPart2Answers] = useState<any>({});
    const [partType, setPartType] = useState<string>('');

    useEffect(() => {
        const loadSubmission = async () => {
            if (!submissionId) {
                setError('Submission ID không hợp lệ');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Get submission data
                const submissionData = await userExamService.getSubmission(parseInt(submissionId));
                setSubmission(submissionData);

                // Parse the JSON data (now it's an object, not a string)
                const parsedData = typeof submissionData.json_data === 'string'
                    ? JSON.parse(submissionData.json_data)
                    : submissionData.json_data;
                setUserAnswers(parsedData.userAnswers || {});
                setUserPart2Answers(parsedData.userPart2Answers || {});
                setPartType(parsedData.partType || '');

                // Get exam details
                if (parsedData.examId) {
                    const examData = await userExamService.getUserExamDetail(parsedData.examId);
                    setExam(examData);
                }
            } catch (err: any) {
                setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu bài làm');
                showNotification({
                    title: 'Lỗi',
                    message: 'Không thể tải dữ liệu bài làm',
                    color: 'red'
                });
            } finally {
                setLoading(false);
            }
        };

        loadSubmission();
    }, [submissionId]);

    if (loading) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader />
            </Center>
        );
    }

    if (error) {
        return (
            <Center style={{ height: '60vh' }}>
                <Text c="red">{error}</Text>
            </Center>
        );
    }

    if (!submission || !exam) {
        return (
            <Center style={{ height: '60vh' }}>
                <Text>Không tìm thấy dữ liệu bài làm</Text>
            </Center>
        );
    }

    return (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>Bài làm đã nộp</Title>
                    <Text size="sm" c="dimmed">
                        Điểm số: {submission.score} | 
                        Nộp lúc: {new Date(submission.created_at || submission.submittedAt).toLocaleString('vi-VN')}
                    </Text>
                </div>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </Group>

            <ExamRenderer
                partType={partType}
                exam={exam}
                userAnswers={userAnswers}
                userPart2Answers={userPart2Answers}
                submitted={true} // Always show as submitted
                onAnswerChange={() => {}} // Disabled
                onPart2AnswerChange={() => {}} // Disabled
                onDragEnd={() => {}} // Disabled
            />
        </Paper>
    );
};

export default ViewSubmission;
