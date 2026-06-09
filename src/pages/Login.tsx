import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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

export const Login: React.FC = () => {
  const navigate = useNavigate();
  
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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-white/60 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-950 tracking-tight">Sign In</h2>
          <p className="text-sm text-gray-500 mt-2">Access Trippy Admin Panel</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              {...register('email')} 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 text-left">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              {...register('password')} 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 text-left">{errors.password.message}</p>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition duration-200 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
