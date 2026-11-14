"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const mongoose_1 = require("mongoose");
const cartSchema = new mongoose_1.Schema({
    sessionId: String,
    userId: String,
    items: [
        { productSlug: String, name: String, price: Number, quantity: Number, variant: String, image: String },
    ],
}, { timestamps: true });
exports.CartModel = (0, mongoose_1.model)('Cart', cartSchema);
//# sourceMappingURL=Cart.js.map