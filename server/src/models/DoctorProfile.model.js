import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    consultationDuration: {
      type: Number,
      enum: [15, 20, 30, 60],
      default: 30,
    },
    profileImage: {
      type: String,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    bio: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
export default DoctorProfile;
