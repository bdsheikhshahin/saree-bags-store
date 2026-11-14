"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDbConnected = void 0;
exports.connectDb = connectDb;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDb() {
    try {
        // Short timeout: without MongoDB the API must still start quickly
        // and serve seed data, not hang for the 30s default.
        await mongoose_1.default.connect(env_1.env.mongoUri, { serverSelectionTimeoutMS: 3000 });
        console.log('MongoDB connected');
        return true;
    }
    catch (err) {
        console.warn('MongoDB not available — API will serve seed data as a fallback. Start MongoDB and restart to use the database.', err instanceof Error ? err.message : err);
        return false;
    }
}
const isDbConnected = () => mongoose_1.default.connection.readyState === 1;
exports.isDbConnected = isDbConnected;
//# sourceMappingURL=db.js.map