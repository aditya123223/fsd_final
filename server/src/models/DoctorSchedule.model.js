import mongoose from 'mongoose';

const intervalSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // HH:mm
    end: { type: String, required: true },   // HH:mm
  },
  { _id: false }
);

const breakIntervalSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
    label: { type: String },
  },
  { _id: false }
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    workingIntervals: {
      type: [intervalSchema],
      default: [],
    },
    breakIntervals: {
      type: [breakIntervalSchema],
      default: [],
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

doctorScheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

const DoctorSchedule = mongoose.model('DoctorSchedule', doctorScheduleSchema);
export default DoctorSchedule;
