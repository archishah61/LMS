// components/auth/ProtectedRoute.jsx (improved version)
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';
import { useVerifyTokenQuery } from '../../services/userAuthApi';
import { getStudentToken } from '../../services/CookieService';

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const { access_token } = getStudentToken();
  const { data, isError, isLoading, isSuccess } = useVerifyTokenQuery({ 
    access_token 
  }, {
    skip: !access_token // Skip if no token
  });

  useEffect(() => {
    if (!access_token) {
      navigate('/login', { state: { from: location.pathname } });
    } else if (!isLoading && isError) {
      navigate('/login', { 
        state: { 
          from: location.pathname,
          error: "Session expired" 
        } 
      });
    }
  }, [access_token, isError, isLoading]);

  if (isLoading) return <div>Loading...</div>;
  
  return isSuccess ? <Outlet /> : null;
};

export default ProtectedRoute;