const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  subTasks: [{
    title: {
      type: String,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'pending', 'completed', 'cancelled'],
    default: 'new'
  },
  dueDateTime: {
    type: Date,
    required: true
  },
  reminderSettings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reminderDateTime: {
      type: Date,
      required: true
    },
    lastReminded: {
      type: Date,
      default: null
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Virtual field for remaining time
taskSchema.virtual('remainingTime').get(function() {
  // Kullanıcıya özel hatırlatma zamanını bul
  const userReminderSetting = this.reminderSettings?.[0];
  
  if (!userReminderSetting) {
    return 'No reminder set';
  }

  const reminderDateTime = userReminderSetting.reminderDateTime;

  if (reminderDateTime) {
    const now = new Date();
    const reminder = new Date(reminderDateTime);
    const diff = reminder - now;

    // If past reminder date
    if (diff < 0) {
      return 'Reminder';
    }

    // Convert milliseconds to days, hours, minutes
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m remaining`;
    } else {
      return 'in a minute';
    }
  }
  return 'No reminder date';
});

// Kullanıcıya özel hatırlatma zamanını getiren yardımcı metod
taskSchema.methods.getReminderDateTime = function(userId) {
  const userSetting = this.reminderSettings.find(setting => 
    setting.userId.toString() === userId.toString()
  );
  return userSetting ? userSetting.reminderDateTime : this.dueDateTime;
};

// Kullanıcıya özel hatırlatma zamanını ayarlayan yardımcı metod
taskSchema.methods.setReminderDateTime = function(userId, dateTime) {
  const settingIndex = this.reminderSettings.findIndex(setting => 
    setting.userId.toString() === userId.toString()
  );

  if (settingIndex > -1) {
    this.reminderSettings[settingIndex].reminderDateTime = dateTime;
  } else {
    this.reminderSettings.push({
      userId: userId,
      reminderDateTime: dateTime
    });
  }
};

// Ensure virtuals are included in JSON output
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema); 