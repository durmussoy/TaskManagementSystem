import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthViewModel } from '../viewmodels/authViewModel';
import { AuthService } from '../services/authService';

export const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { register, loading, error } = useAuthViewModel();

    const validateForm = async () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'İsim gereklidir';
        }

        if (!await AuthService.validateEmail(formData.email)) {
            newErrors.email = 'Geçerli bir email adresi giriniz';
        }

        if (!AuthService.validatePassword(formData.password)) {
            newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (await validateForm()) {
            const success = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (success) {
                navigate('/tasks');
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="auth-container">
            <h2>Kayıt Ol</h2>
            <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label>İsim:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label>Şifre:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    {errors.password && <span className="error">{errors.password}</span>}
                </div>

                <div className="form-group">
                    <label>Şifre Tekrar:</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                </button>
            </form>
        </div>
    );
}; 