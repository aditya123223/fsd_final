import mongoose from 'mongoose';

const slotReservationSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint to prevent race conditions
slotReservationSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  { unique: true }
);

// TTL index — MongoDB will remove expired reservations automatically
slotReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const SlotReservation = mongoose.model('SlotReservation', slotReservationSchema);
export default SlotReservation;
