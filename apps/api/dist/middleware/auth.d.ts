import type { NextFunction, Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'customer' | 'admin';
    };
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map