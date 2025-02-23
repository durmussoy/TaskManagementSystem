import { taskApi } from '../../../core/api/taskApi';

export class TaskService {
    static validateTaskData(taskData) {
        const errors = {};

        if (!taskData.title?.trim()) {
            errors.title = 'Başlık gereklidir';
        }

        if (!taskData.description?.trim()) {
            errors.description = 'Açıklama gereklidir';
        }

        if (!taskData.dueDate) {
            errors.dueDate = 'Bitiş tarihi gereklidir';
        } else {
            const now = new Date();
            const dueDate = new Date(taskData.dueDate);
            if (dueDate < now) {
                errors.dueDate = 'Bitiş tarihi geçmiş bir tarih olamaz';
            }
        }

        // Alt görevler için validasyon
        if (taskData.subTasks) {
            const subTaskErrors = [];
            taskData.subTasks.forEach((subTask, index) => {
                if (!subTask.title?.trim()) {
                    subTaskErrors[index] = 'Alt görev başlığı gereklidir';
                }
            });
            if (subTaskErrors.length > 0) {
                errors.subTasks = subTaskErrors;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static async createTaskWithValidation(taskData) {
        const validation = this.validateTaskData(taskData);
        if (!validation.isValid) {
            throw new Error(JSON.stringify(validation.errors));
        }
        return await taskApi.createTask(taskData);
    }

    static async updateTaskWithValidation(taskId, taskData) {
        const validation = this.validateTaskData(taskData);
        if (!validation.isValid) {
            throw new Error(JSON.stringify(validation.errors));
        }
        return await taskApi.updateTask(taskId, taskData);
    }

    static formatTaskDate(date) {
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getTaskStatus(task) {
        const now = new Date();
        const dueDate = new Date(task.dueDate);

        if (task.completed) {
            return { status: 'completed', label: 'Tamamlandı' };
        }

        if (dueDate < now) {
            return { status: 'overdue', label: 'Gecikmiş' };
        }

        const diffTime = Math.abs(dueDate - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            return { status: 'urgent', label: 'Acil' };
        }

        if (diffDays <= 3) {
            return { status: 'warning', label: 'Yaklaşıyor' };
        }

        return { status: 'normal', label: 'Normal' };
    }

    static getSubTasksProgress(task) {
        if (!task.subTasks || task.subTasks.length === 0) {
            return {
                total: 0,
                completed: 0,
                percentage: 0
            };
        }

        const total = task.subTasks.length;
        const completed = task.subTasks.filter(st => st.isCompleted).length;
        const percentage = Math.round((completed / total) * 100);

        return {
            total,
            completed,
            percentage
        };
    }
} 