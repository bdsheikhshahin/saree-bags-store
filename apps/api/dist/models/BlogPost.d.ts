import { type Document } from 'mongoose';
import type { BlogPost } from '@ecommerce/shared';
export interface BlogPostDoc extends Omit<BlogPost, '_id'>, Document {
}
export declare const BlogPostModel: import("mongoose").Model<BlogPostDoc, {}, {}, {}, Document<unknown, {}, BlogPostDoc, {}, {}> & BlogPostDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=BlogPost.d.ts.map