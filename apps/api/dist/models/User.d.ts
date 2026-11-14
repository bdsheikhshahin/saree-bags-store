import { type Document } from 'mongoose';
export interface UserDoc extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: 'customer' | 'admin';
}
export declare const UserModel: import("mongoose").Model<UserDoc, {}, {}, {}, Document<unknown, {}, UserDoc, {}, {}> & UserDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map