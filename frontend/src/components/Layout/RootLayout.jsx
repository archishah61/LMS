// components/Layout/RootLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import VoiceAssistant from '../Home/courses/VoiceAssistant';
import { useEffect } from 'react';
import { AuthModalProvider } from '../../context/AuthModalContext';

const RootLayout = () => {

    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <AuthModalProvider>
            {/* <VoiceAssistant /> */}
            <Outlet />
        </AuthModalProvider>
    );
};

export default RootLayout;
