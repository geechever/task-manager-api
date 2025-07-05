const Task = require('../models/Task');
const logger = require('../utils/logger');

const getAllTasks = async (req, res, next) => {
  try {
    let query = { user: req.user._id };
    
    // Admin can see all tasks
    if (req.user.role === 'admin') {
      query = {};
    }

    const tasks = await Task.find(query).populate('user', 'username email');
    res.json(tasks);
  } catch (err) {
    logger.error('Get All Tasks Error:', err);
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      user: req.user._id
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    logger.error('Create Task Error:', err);
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'username email');
    
    // Admin can access any task
    if (!task && req.user.role === 'admin') {
      const adminTask = await Task.findById(req.params.id).populate('user', 'username email');
      if (adminTask) {
        return res.json(adminTask);
      }
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    logger.error('Get Task By ID Error:', err);
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, completed, dueDate, priority } = req.body;
    
    let task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    // Admin can update any task
    if (!task && req.user.role === 'admin') {
      task = await Task.findById(req.params.id);
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.completed = completed !== undefined ? completed : task.completed;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;

    await task.save();
    res.json(task);
  } catch (err) {
    logger.error('Update Task Error:', err);
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    let task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    // Admin can delete any task
    if (!task && req.user.role === 'admin') {
      task = await Task.findByIdAndDelete(req.params.id);
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    logger.error('Delete Task Error:', err);
    next(err);
  }
};

module.exports = {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
};