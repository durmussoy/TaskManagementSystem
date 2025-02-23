const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks (only for the user)
router.get('/', async (req, res) => {
  try {
    console.log('Getting tasks... User ID:', req.user.userId);
    const tasks = await Task.find({
      $or: [
        { assignedTo: req.user.userId },
        { createdBy: req.user.userId }
      ]
    })
    .populate('assignedTo', 'name username')
    .populate('createdBy', 'name username')
    .sort({ createdAt: -1 });

    console.log('Tasks retrieved successfully:', tasks.length);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    console.log('New task request:', req.body);
    const { title, description, dueDateTime, reminderDateTime, status, subTasks } = req.body;

    if (!title || !description || !dueDateTime || !reminderDateTime) {
      console.log('Missing fields:', { title, description, dueDateTime, reminderDateTime });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate dates
    const now = new Date();
    const dueDate = new Date(dueDateTime);
    const reminderDate = new Date(reminderDateTime);

    if (dueDate < now) {
      return res.status(400).json({ message: 'Due date cannot be in the past' });
    }

    if (reminderDate > dueDate) {
      return res.status(400).json({ message: 'Reminder time cannot be after due date' });
    }

    // Validate sub-tasks if present
    if (subTasks) {
      for (const subTask of subTasks) {
        if (!subTask.title || !subTask.title.trim()) {
          return res.status(400).json({ message: 'All sub-tasks must have a title' });
        }
      }
    }

    const task = new Task({
      title,
      description,
      dueDateTime,
      status: status || 'new',
      assignedTo: req.body.assignedTo || req.user.userId,
      createdBy: req.user.userId,
      subTasks: subTasks || [],
      reminderSettings: [{
        userId: req.user.userId,
        reminderDateTime: reminderDateTime
      }]
    });

    await task.save();
    console.log('New task created:', task);
    
    // Return populated task
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username')
      .populate('createdBy', 'name username');
      
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    // First find task and check permissions
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only creator or assigned user can update
    if (task.createdBy.toString() !== req.user.userId && 
        task.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }

    // Validate dates if they are being updated
    if (req.body.dueDateTime) {
      const dueDate = new Date(req.body.dueDateTime);
      const now = new Date();
      if (dueDate < now) {
        return res.status(400).json({ message: 'Due date cannot be in the past' });
      }
    }

    if (req.body.reminderDateTime) {
      const reminderDate = new Date(req.body.reminderDateTime);
      const dueDate = new Date(req.body.dueDateTime || task.dueDateTime);
      if (reminderDate > dueDate) {
        return res.status(400).json({ message: 'Reminder time cannot be after due date' });
      }
      // Kullanıcıya özel hatırlatma zamanını güncelle
      task.setReminderDateTime(req.user.userId, reminderDate);
      await task.save();
    }

    // Diğer alanları güncelle
    if (req.body.title) task.title = req.body.title;
    if (req.body.description) task.description = req.body.description;
    if (req.body.dueDateTime) task.dueDateTime = req.body.dueDateTime;
    if (req.body.status) task.status = req.body.status;
    if (req.body.subTasks) {
      // Validate sub-tasks
      for (const subTask of req.body.subTasks) {
        if (!subTask.title || !subTask.title.trim()) {
          return res.status(400).json({ message: 'All sub-tasks must have a title' });
        }
      }
      task.subTasks = req.body.subTasks;
    }

    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name username')
      .populate('createdBy', 'name username');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    // First find task and check permissions
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only creator can delete
    if (task.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 