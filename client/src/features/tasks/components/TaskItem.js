import React from 'react';
import { TaskService } from '../services/TaskService';
import { useTaskViewModel } from '../viewmodels/TaskViewModel';

const TaskItem = ({ task }) => {
    const { updateTask, deleteTask } = useTaskViewModel();
    const { status, label } = TaskService.getTaskStatus(task);

    const handleToggleComplete = async () => {
        await updateTask(task._id, {
            ...task,
            completed: !task.completed
        });
    };

    const handleDelete = async () => {
        if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            await deleteTask(task._id);
        }
    };

    return (
        <div className={`task-item ${status}`}>
            <div className="task-header">
                <h4 className="task-title">{task.title}</h4>
                <span className={`task-status ${status}`}>{label}</span>
            </div>
            
            <p className="task-description">{task.description}</p>
            
            <div className="task-footer">
                <div className="task-date">
                    <span>Bitiş: {TaskService.formatTaskDate(task.dueDate)}</span>
                </div>
                
                <div className="task-actions">
                    <button
                        className={`complete-button ${task.completed ? 'completed' : ''}`}
                        onClick={handleToggleComplete}
                    >
                        {task.completed ? 'Geri Al' : 'Tamamla'}
                    </button>
                    
                    <button
                        className="delete-button"
                        onClick={handleDelete}
                    >
                        Sil
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskItem; 