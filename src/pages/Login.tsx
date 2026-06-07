import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../utilities/api';
import { AuthContextTrippy } from '../context/AuthContextTrippy';

type FormValues = {
    email: string;
    password: string;
};

const schema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
}).required();

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #f0f4ff, #d9e8ff);
`;

const Card = styled.form`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  padding: 2rem 3rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  width: 340px;
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.6);
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #0077ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #0055cc;
  }
`;

const ErrorMsg = styled.p`
  color: #e74c3c;
  margin: -0.5rem 0 0.5rem 0;
  font-size: 0.875rem;
  text-align: left;
`;

export const Login: React.FC = () => {
    const navigate = useNavigate();
  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/home');
    }
  }, [navigate]);
    const { login } = React.useContext(AuthContextTrippy);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: FormValues) => {
        try {
            const response = await adminLogin(data.email, data.password);
            if (response?.token) {
                // Call the context login to propagate reactive authentication status
                login({ data: response.user, token: response.token }, 'admin');
                navigate('/home');
            } else {
                alert('Login failed: Invalid response');
            }
        } catch (err) {
            console.error(err);
            alert('Login failed: ' + (err as any).message);
        }
    };

    return (
        <Container>
            <Card onSubmit={handleSubmit(onSubmit)}>
                <Title>Sign In</Title>
                <Input type="email" placeholder="Email" {...register('email')} />
                {errors.email && <ErrorMsg>{errors.email.message}</ErrorMsg>}
                <Input type="password" placeholder="Password" {...register('password')} />
                {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
            </Card>
        </Container>
    );
};
