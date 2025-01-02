import React, { useState } from 'react';
import { useTaskViewModel } from '../viewmodels/TaskViewModel';
import { TaskService } from '../services/TaskService';

export const TaskForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: ''
    });
    const [errors, setErrors] = useState({});
    const { createTask, loading } = useTaskViewModel();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validation = TaskService.validateTaskData(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        try {
            const success = await createTask(formData);
            if (success) {
                setFormData({ title: '', description: '', dueDate: '' });
                setErrors({});
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            const errorData = JSON.parse(err.message);
            setErrors(errorData);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Hata mesajını temizle
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="task-form">
            <div className="form-group">
                <label>Başlık:</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Görev başlığı"
                />
                {errors.title && <span className="error">{errors.title}</span>}
            </div>

            <div className="form-group">
                <label>Açıklama:</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Görev açıklaması"
                    rows={3}
                />
                {errors.description && <span className="error">{errors.description}</span>}
            </div>

            <div className="form-group">
                <label>Bitiş Tarihi:</label>
                <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    min={new Date().toISOString().slice(0, 16)}
                />
                {errors.dueDate && <span className="error">{errors.dueDate}</span>}
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Görevi Kaydet'}
            </button>
        </form>
    );
}; 