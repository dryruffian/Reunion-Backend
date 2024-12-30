import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A todo must have a title'],
    trim: true,
    maxLength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'finished'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  endDate: {
    type: Date,
    required: [true, 'A todo must have a due date']
  },
  startDate: {
    type: Date,
    required: [true, 'A todo must have a start date']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Todo must belong to a user']
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ status: 1 });


todoSchema.pre('save', function(next) {
  if (this.startDate > this.endDate) {
    next(new Error('Start date must be before end date'));
  }
  next();
});


todoSchema.virtual('timeRemaining').get(function() {
  if (this.dueDate) {
    return this.dueDate.getTime() - Date.now();
  }
  return null;
});


todoSchema.methods.toggleComplete = function() {
  this.isCompleted = !this.isCompleted;
  this.completedAt = this.isCompleted ? Date.now() : undefined;
  return this.save();
};


todoSchema.statics.getOverdueTodos = function(userId) {
  return this.find({
    user: userId,
    dueDate: { $lt: new Date() },
    isCompleted: false
  });
};

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;