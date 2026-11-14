import { type Document } from 'mongoose';
import type { HomepageSection } from '@ecommerce/shared';
export interface HomepageSectionDoc extends Omit<HomepageSection, '_id' | 'createdAt'>, Document {
}
export declare const HomepageSectionModel: import("mongoose").Model<HomepageSectionDoc, {}, {}, {}, Document<unknown, {}, HomepageSectionDoc, {}, {}> & HomepageSectionDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=HomepageSection.d.ts.map