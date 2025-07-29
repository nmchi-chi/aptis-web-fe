import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextInput, Button, Paper, Title, Container, Text, Image, Stack, Anchor } from '@mantine/core';
import { RootState } from '../store';
import { Link } from 'react-router-dom';

const isValidPhoneNumber = (phone: string) => {
  const regex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return regex.test(phone);
};

const GuestInfo: React.FC = () => {
  const dispatch = useDispatch();
  const [fullname, setFullname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const error = useSelector((state: RootState) => state.auth.error);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const [phoneError, setPhoneError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneError('Bạn ơi, số điện thoại sai định dạng mất rồi :(');
      return;
    } else {
      setPhoneError('');
    }

    dispatch({
      type: 'auth/guestInfoRequest',
      payload: {
        fullname,
        phone_number: phoneNumber
      }
    });
  };

  return (
    <Container fluid
    style={{
      width: '100vw',
      minHeight: '100vh',
      padding: 0,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url(/assets/background.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <Paper
        withBorder
        shadow="md"
        p="xl"
        radius="md"
        style={{
          width: '100%',
          maxWidth: 500,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Stack align="center" mb="xl">
          <Image
            src="/assets/logo.png"
            alt="APTIS Logo"
            width={120}
            height={120}
            fallbackSrc="https://placehold.co/120x120?text=APTIS"
          />
          <Title order={1} ta="center" fw={900} c="green.7">
            APTIS ONE Test
          </Title>
        </Stack>

        {/* Hiển thị lỗi nếu có */}
        {error && (
          <Text color="red" ta="center" mt="md" fw={700}>
            {error}
          </Text>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Họ và tên"
              placeholder="Nhập họ và tên của bạn"
              required
              size="md"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              styles={{
                label: {
                  marginBottom: 'var(--mantine-spacing-xs)',
                  color: 'var(--mantine-color-green-7)'
                },
                input: {
                  height: 45,
                  '&:focus': {
                    borderColor: 'var(--mantine-color-green-5)'
                  }
                }
              }}
            />

            <TextInput
              label="Số điện thoại"
              placeholder="Nhập số điện thoại của bạn"
              required
              size="md"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (phoneError) setPhoneError('');
              }}
              error={phoneError}
              styles={{
                label: {
                  marginBottom: 'var(--mantine-spacing-xs)',
                  color: 'var(--mantine-color-green-7)'
                },
                input: {
                  height: 45,
                  '&:focus': {
                    borderColor: 'var(--mantine-color-green-5)'
                  }
                }
              }}
            />

            <Button
              type="submit"
              size="md"
              fullWidth
              loading={isLoading}
              style={{
                height: 45,
                backgroundColor: 'var(--mantine-color-green-6)',
                '&:hover': {
                  backgroundColor: 'var(--mantine-color-green-7)'
                }
              }}
            >
              Tiếp tục
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="lg">
          <Anchor
            component={Link}
            to="/login"
            c="green.6"
            size="sm"
            fw={500}
            style={{ textDecoration: 'underline' }}
          >
            Back to login
          </Anchor>
        </Text>
        <Text c="green.6" size="sm" ta="center" mt="xl">
          © 2025 APTIS ONE Test. All rights reserved.
        </Text>
      </Paper>
    </Container>
  );
};

export default GuestInfo;
