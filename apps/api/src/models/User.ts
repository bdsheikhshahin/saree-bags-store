import { Schema, model, type Document } from 'mongoose';

export interface UserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
}

const userSchema = new Schema<UserDoc>(
  {
    name: { required: true, type: String },
    email: { index: true, lowercase: true, required: true, type: String, unique: true },
    passwordHash: { required: true, type: String },
    role: { default: 'customer', enum: ['customer', 'admin'], type: String },
  },
  { timestamps: true },
);

export const UserModel = model<UserDoc>('User', userSchema);
