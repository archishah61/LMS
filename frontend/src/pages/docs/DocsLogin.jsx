import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function ProtectedLoginForm() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    // The static password - in a real app you'd want a more secure approach
    const CORRECT_PASSWORD = import.meta.env.VITE_DOCS_PASSWORD;
    const DOCS_KEY = 'docs_token';

    useEffect(() => {
        // Check if user is already authenticated
        const storedAuth = localStorage.getItem(DOCS_KEY);
        if (storedAuth === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
            navigate("/docs");
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate a small delay for better UX
        setTimeout(() => {
            if (password === CORRECT_PASSWORD) {
                // Store password in localStorage
                localStorage.setItem(DOCS_KEY, password);
                // Set authenticated state
                setIsAuthenticated(true);

                navigate("/docs");
                // In a real app with routing, you'd use:
                // window.location.href = '/docs';
            } else {
                setError('Invalid password. Please try again.');
            }
            setLoading(false);
        }, 500);
    };

    // Login form
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <Lock className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">Protected Area</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter the password to access protected content
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm">
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter password"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubmit(e);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {loading ? 'Checking...' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}