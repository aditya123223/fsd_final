import mongoose from 'mongoose';

const customIntervalSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const scheduleExceptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['leave', 'blocked', 'custom-hours'],
      required: true,
    },
    customIntervals: {
      type: [customIntervalSchema],
      default: [],
    },
    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

scheduleExceptionSchema.index({ doctorId: 1, date: 1 }, { unique: true });

const ScheduleException = mongoose.model('ScheduleException', scheduleExceptionSchema);
export default ScheduleException;
