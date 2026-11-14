"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { required: true, type: String },
    email: { index: true, lowercase: true, required: true, type: String, unique: true },
    passwordHash: { required: true, type: String },
    role: { default: 'customer', enum: ['customer', 'admin'], type: String },
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map