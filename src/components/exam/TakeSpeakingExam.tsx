import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Paper, Title, Text, Button, Stack, Box, Group, Image, Progress, Loader } from '@mantine/core';


import { userExamService } from '../../services/userExamService';

// Component hiển thị ảnh từ image_url
function ImageViewer({ imagePath, alt }: { imagePath: string; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadImage = useCallback(async () => {
    setLoading(true);
    try {
      // Use API for server paths
      const response = await userExamService.getUserExamAudio({ audio_path: imagePath });

      let base64;
      if (typeof response === 'string') {
        base64 = response;
      } else if (response && response.base64) {
        base64 = response.base64;
      } else if (response && response.audio) {
        base64 = response.audio;
      } else {
        console.error('Unexpected image response format');
        return;
      }

      if (base64) {
        setImageUrl(`data:image/jpeg;base64,${base64}`);
      }
    } catch (error) {
      console.error('Error loading image:', error);
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
    return <Text size="sm" c="dimmed">No image available</Text>;
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      style={{ maxWidth: '40%', height: 'auto' }}
      radius="md"
    />
  );
}

interface SpeakingQuestion {
  id: number;
  text: string;
  audio: string | null;
}

interface SpeakingPart {
  part: number;
  topic: string;
  instruction: string;
  instruction_audio: string[];
  question: SpeakingQuestion[];
  image_url_1: string | null;
  image_url_2: string | null;
}

interface TakeSpeakingExamProps {
  exam: SpeakingPart[];
  onSubmit: (audioPaths: string[]) => void;
}

export default function TakeSpeakingExam({ exam, onSubmit }: TakeSpeakingExamProps) {
  // State
  const [currentPart, setCurrentPart] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [phase, setPhase] = useState<'instruction' | 'question' | 'thinking' | 'recording' | 'completed'>('instruction');
  const [timeLeft, setTimeLeft] = useState(5);
  const [audioPaths, setAudioPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const instructionAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup function to stop all audio
  const stopAllAudio = useCallback(() => {
    if (instructionAudioRef.current) {
      instructionAudioRef.current.pause();
      instructionAudioRef.current.currentTime = 0;
      instructionAudioRef.current = null;
    }
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current.currentTime = 0;
      questionAudioRef.current = null;
    }
    if (beepAudioRef.current) {
      beepAudioRef.current.pause();
      beepAudioRef.current.currentTime = 0;
      beepAudioRef.current = null;
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopAllAudio]);

  // Get current part data
  const currentPartData: SpeakingPart | null = exam?.find((part: SpeakingPart) => part.part === currentPart) || null;

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          // Lấy phần base64 sau dấu phẩy
          const base64 = result.split(',')[1];
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Thêm hàm log để ghi log ra console
  const logInfo = useCallback((message: string) => {
    console.log(`[SpeakingExam] ${message}`);
  }, []);

  // Move to next question or part
  const moveToNext = useCallback(() => {
    if (!currentPartData) return;

    const totalQuestions = currentPartData.question.length;

    if (currentQuestion < totalQuestions - 1) {
      // Next question in same part
      console.log(`Moving to question ${currentQuestion + 2} in part ${currentPart}`);
      setCurrentQuestion(prev => prev + 1);
      setPhase('question');
    } else if (currentPart < 4) {
      // Next part
      console.log(`Moving to part ${currentPart + 1}`);
      setCurrentPart(prev => prev + 1);
      setCurrentQuestion(0);
      setPhase('instruction');
    } else {
      // Completed
      console.log('All parts completed');
      setPhase('completed');
    }
  }, [currentPartData, currentQuestion, currentPart]);

  // Upload audio
  const uploadAudio = useCallback(async (questionId: number) => {
    logInfo(`uploadAudio called for question ${questionId}`);

    if (audioChunksRef.current.length === 0) {
      logInfo('No audio chunks to upload');
      moveToNext();
      return;
    }

    setLoading(true);
    try {
      // Tạo blob từ chunks
      logInfo(`Creating blob from ${audioChunksRef.current.length} chunks`);
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      logInfo(`Audio blob created: ${audioBlob.size} bytes`);

      // Convert blob to base64
      logInfo('Converting blob to base64...');
      const audioBase64 = await blobToBase64(audioBlob);
      logInfo(`Base64 conversion complete: ${audioBase64.length} chars`);

      // Gọi API để upload audio
      logInfo(`Calling API to upload audio for question ${questionId}`);
      const response = await userExamService.uploadQuestionAudio(questionId, audioBase64);
      logInfo(`API response received: ${JSON.stringify(response)}`);

      // Lưu đường dẫn audio
      const audioPath = response.audio_path || response.path || `question_${questionId}`;
      logInfo(`Setting audio path: ${audioPath}`);
      setAudioPaths(prev => [...prev, audioPath]);

      logInfo(`Audio uploaded successfully: ${audioPath}`);
    } catch (error) {
      logInfo(`Error uploading audio: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      moveToNext();
    }
  }, [logInfo, moveToNext]);

  // Start recording
  const startRecording = useCallback(async () => {
    logInfo('startRecording called');

    if (!currentPartData) {
      logInfo('No current part data');
      return;
    }

    const questionData = currentPartData.question[currentQuestion];
    if (!questionData) {
      logInfo('No question data');
      return;
    }

    logInfo(`Starting recording for Part ${currentPart}, Q${currentQuestion + 1}, ID: ${questionData.id}`);

    try {
      // Yêu cầu quyền truy cập microphone
      logInfo('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logInfo('Microphone access granted');

      // Tạo MediaRecorder mới
      logInfo('Creating MediaRecorder...');
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Thiết lập sự kiện ondataavailable
      mediaRecorder.ondataavailable = (event) => {
        logInfo(`Data available: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          logInfo(`Total chunks: ${audioChunksRef.current.length}`);
        }
      };

      // Thiết lập sự kiện onstop
      mediaRecorder.onstop = async () => {
        logInfo('MediaRecorder onstop event triggered');

        // Dừng tất cả các track
        stream.getTracks().forEach(track => {
          logInfo(`Stopping track: ${track.kind}`);
          track.stop();
        });

        // Upload audio
        logInfo(`Preparing to upload audio for question ${questionData.id}`);
        await uploadAudio(questionData.id);
      };

      // Thiết lập sự kiện onerror
      mediaRecorder.onerror = (event) => {
        logInfo(`MediaRecorder error: ${(event as any).error || 'Unknown error'}`);
      };

      // Thiết lập thời gian ghi âm theo part
      let duration : number;
      if (currentPart === 1) {
        duration = 30; // Part 1: 30 giây
      } else if (currentPart === 2 || currentPart === 3) {
        duration = 45; // Part 2, 3: 45 giây
      } else if (currentPart === 4) {
        duration = 120; // Part 4: 120 giây (2 phút)
      } else {
        duration = 30; // Default
      }

      // Thiết lập sự kiện onstart - bắt đầu timer khi MediaRecorder thực sự bắt đầu
      mediaRecorder.onstart = () => {
        logInfo('MediaRecorder onstart event triggered - starting timer');
        setPhase('recording');

        // Clear any existing timer first
        if (timerRef.current) {
          logInfo('Clearing existing timer before starting new one');
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Use timestamp-based timer for accuracy
        const startTime = Date.now();

        setTimeLeft(duration);
        logInfo(`Setting timer for ${duration} seconds (Part ${currentPart}, Question ${currentQuestion + 1})`);

        // Start countdown immediately
        logInfo('Starting new timer with timestamp-based calculation');
        timerRef.current = setInterval(() => {
          const now = Date.now();
          const elapsedMs = now - startTime;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          const remainingSeconds = Math.max(0, duration - elapsedSeconds);

        setTimeLeft(remainingSeconds);
        logInfo(`Timer: ${remainingSeconds}s remaining (Part ${currentPart}, Q${currentQuestion + 1})`);

        if (remainingSeconds <= 0) {
          logInfo('Timer reached 0 - stopping recording');

          // Dừng timer
          if (timerRef.current) {
            logInfo('Clearing timer');
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Dừng ghi âm
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            logInfo('Stopping MediaRecorder from timer');
            try {
              // Yêu cầu dữ liệu cuối cùng trước khi dừng
              mediaRecorderRef.current.requestData();
              // Dừng MediaRecorder
              mediaRecorderRef.current.stop();
              logInfo(`MediaRecorder state after stop: ${mediaRecorderRef.current.state}`);
            } catch (error) {
              logInfo(`Error stopping MediaRecorder: ${(error as Error).message}`);
            }
          } else {
            logInfo(`MediaRecorder not recording or not available. State: ${mediaRecorderRef.current?.state || 'null'}`);
            // Nếu không có MediaRecorder, vẫn cần upload
            if (questionData) {
              uploadAudio(questionData.id);
            }
          }

          return 0;
        }

        return remainingSeconds;
      }, 1000);
      };

      // Bắt đầu ghi âm và yêu cầu chunks mỗi 1 giây
      logInfo('Starting MediaRecorder...');
      mediaRecorder.start(1000);
      logInfo(`MediaRecorder state: ${mediaRecorder.state}`);

    } catch (error) {
      logInfo(`Error in startRecording: ${(error as Error).message}`);
      moveToNext();
    }
  }, [currentPart, currentQuestion, currentPartData, logInfo, moveToNext, uploadAudio]);



  // Play instruction audio from assets
  const playInstructionAudio = useCallback(async () => {
    try {
      // Tạo path dựa trên currentPart: part1.mp3, part2.mp3, etc.
      const audioFileName = `part${currentPart}.mp3`;
      const audioUrl = `/assets/instructions/${audioFileName}`;

      console.log(`Playing instruction audio: ${audioUrl}`);
      console.log(`Current part data instruction_audio:`, currentPartData?.instruction_audio);

      // Stop any existing instruction audio
      if (instructionAudioRef.current) {
        instructionAudioRef.current.pause();
        instructionAudioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      instructionAudioRef.current = audio;

      audio.onended = () => {
        console.log('Instruction audio ended, moving to questions');
        instructionAudioRef.current = null;
        setPhase('question');
      };

      audio.onerror = (error) => {
        console.log('Instruction audio error:', error);
        console.log('Moving to questions anyway');
        instructionAudioRef.current = null;
        setPhase('question');
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing instruction audio:', error);
      setPhase('question');
    }
  }, [currentPart, currentPartData]);

  // Play question audio
  const playQuestionAudio = useCallback(async () => {
    if (!currentPartData) return;

    const questionData = currentPartData.question[currentQuestion];
    if (!questionData?.audio) {
      console.log('No audio for this question');

      // Part 4 có thinking time, các part khác bắt đầu recording luôn
      if (currentPart === 4) {
        console.log('Part 4: Starting thinking time');
        setPhase('thinking');
      } else {
        console.log('Starting recording immediately');
        startRecording();
      }
      return;
    }

    try {
      console.log(`Playing audio: ${questionData.audio}`);
      const response = await userExamService.getUserExamAudio({ audio_path: questionData.audio });

      let base64;
      if (typeof response === 'string') {
        base64 = response;
      } else if (response && response.base64) {
        base64 = response.base64;
      } else {
        console.log('No audio data');

        // Part 4 có thinking time, các part khác bắt đầu recording luôn
        if (currentPart === 4) {
          console.log('Part 4: Starting thinking time');
          setPhase('thinking');
        } else {
          console.log('Starting recording immediately');
          startRecording();
        }
        return;
      }

      // Stop any existing question audio
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
        questionAudioRef.current = null;
      }

      const audioUrl = `data:audio/mpeg;base64,${base64}`;
      const audio = new Audio(audioUrl);
      questionAudioRef.current = audio;

      audio.onended = () => {
        console.log('Question audio ended');
        questionAudioRef.current = null;

        // Part 4 có thinking time, các part khác bắt đầu recording luôn
        if (currentPart === 4) {
          console.log('Part 4: Starting thinking time');
          setPhase('thinking');
        } else {
          console.log('Starting recording immediately');
          startRecording();
        }
      };

      audio.onerror = () => {
        console.log('Audio error');

        // Part 4 có thinking time, các part khác bắt đầu recording luôn
        if (currentPart === 4) {
          console.log('Part 4: Starting thinking time');
          setPhase('thinking');
        } else {
          console.log('Starting recording immediately');
          startRecording();
        }
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);

      // Part 4 có thinking time, các part khác bắt đầu recording luôn
      if (currentPart === 4) {
        console.log('Part 4: Starting thinking time');
        setPhase('thinking');
      } else {
        console.log('Starting recording immediately');
        startRecording();
      }
    }
  }, [currentPart, currentQuestion, currentPartData, startRecording]);

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'instruction') {
      // Tự động phát instruction audio khi vào phase instruction
      playInstructionAudio();
    }
  }, [phase, playInstructionAudio]);



  useEffect(() => {
    if (phase === 'question') {
      // Wait 3 seconds before auto-playing question audio
      const timer = setTimeout(() => {
        playQuestionAudio();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [phase, playQuestionAudio]);

  // Play beep sound and start recording
  const playBeepAndStartRecording = useCallback(async () => {
    try {
      console.log('Playing beep sound');

      // Stop any existing beep audio
      if (beepAudioRef.current) {
        beepAudioRef.current.pause();
        beepAudioRef.current = null;
      }

      // Phát beep từ assets/instructions/beep.mp3 (hoặc tên file beep khác)
      const beepUrl = '/assets/instructions/beep.mp3';
      const beepAudio = new Audio(beepUrl);
      beepAudioRef.current = beepAudio;

      beepAudio.onended = () => {
        console.log('Beep ended, starting recording');
        beepAudioRef.current = null;
        startRecording();
      };

      beepAudio.onerror = () => {
        console.log('Beep error, starting recording anyway');
        beepAudioRef.current = null;
        startRecording();
      };

      await beepAudio.play();
    } catch (error) {
      console.error('Error playing beep:', error);
      startRecording();
    }
  }, [startRecording]);

  useEffect(() => {
    if (phase === 'thinking') {
      // Part 4: Thinking time 60 giây
      console.log('Starting thinking time: 60 seconds');
      setTimeLeft(60);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          console.log(`Thinking time: ${newTime}s remaining`);

          if (newTime < 0) {
            console.log('Thinking time ended, playing beep');
            clearInterval(timer);
            playBeepAndStartRecording();
            return 0;
          }

          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase, playBeepAndStartRecording]);



  // Handle submit
  const handleSubmit = () => {
    console.log('Submitting with audio paths:', audioPaths);
    onSubmit(audioPaths);
    // Don't navigate here - let parent component handle navigation
  };

  if (!exam || exam.length === 0) {
    return <Text>No exam data available</Text>;
  }

  return (
    <Paper p="xl" shadow="sm">
      <Stack gap="lg">
        <Title order={2}>Speaking Test - Part {currentPart}</Title>

        {phase === 'instruction' && currentPartData && (
          <Box>
            <Text style={{ whiteSpace: 'pre-line' }} mb="lg">
              {currentPartData.instruction}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              🔊 Playing instruction audio...
            </Text>
          </Box>
        )}

        {(phase === 'question' || phase === 'thinking' || phase === 'recording') && currentPartData && (
          <Box>
            <Text size="lg" fw={500} mb="md">
              Question {currentQuestion + 1}:
            </Text>
            <Text size="lg" style={{ whiteSpace: 'pre-line' }} mb="md">
              {currentPartData.question[currentQuestion]?.text}
            </Text>
            {phase === 'question' && (
              <Text size="sm" c="dimmed" ta="center">
                🔊 Playing question audio...
              </Text>
            )}
            {phase === 'thinking' && (
              <Box ta="center">
                <Text size="lg" fw={500} c="blue" mb="md">
                  💭 Thinking time: {timeLeft}s remaining
                </Text>
                <Text size="sm" c="dimmed">
                  Take your time to think about your answer...
                </Text>
              </Box>
            )}
          </Box>
        )}

        {phase === 'recording' && (
          <Box ta="center">
            <Text size="xl" fw={500} c="red" mb="md">
              🎤 Recording... {timeLeft}s remaining
            </Text>
            <Progress
              value={(timeLeft / (currentPart === 1 ? 30 : currentPart === 4 ? 120 : 45)) * 100}
              size="xl"
              color="red"
            />
            {loading && <Text mt="md">Uploading...</Text>}
          </Box>
        )}

        {/* Images - hiện cùng với câu hỏi, thinking time và recording */}
        {(phase === 'question' || phase === 'thinking' || phase === 'recording') &&
         currentPartData && (currentPartData.image_url_1 || currentPartData.image_url_2) && (
          <Group justify="center" gap="lg">
            {currentPartData.image_url_1 && (
              <ImageViewer imagePath={currentPartData.image_url_1} alt="Image 1" />
            )}
            {currentPartData.image_url_2 && (
              <ImageViewer imagePath={currentPartData.image_url_2} alt="Image 2" />
            )}
          </Group>
        )}

        {phase === 'completed' && (
          <Box ta="center">
            <Title order={3} c="green" mb="md">
              🎉 Speaking Test Completed!
            </Title>
            <Text mb="lg">
              You have completed all parts of the speaking test.
            </Text>
            <Text size="sm" c="dimmed" mb="xl">
              Uploaded {audioPaths.length} audio responses.
            </Text>
            <Button size="lg" onClick={handleSubmit}>
              Submit Speaking Test
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}









