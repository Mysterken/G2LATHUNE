import React, { useState } from "react";
import API from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';

const Login = () => {
    const { user, login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await API.post("/auth/login", { email, password });
            login();
            localStorage.setItem("token", data.accessToken);
        } catch (error) {
            toast.error("Erreur lors de la connection", {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                });
            console.error("Login failed");
        }
    };

    if (user) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Login</h1>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                Login
            </button>
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                />

        </form>
    );
};

export default Login;
