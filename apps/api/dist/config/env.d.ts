import 'dotenv/config';
export declare const env: {
    port: number;
    mongoUri: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    corsOrigin: string;
    webUrl: string;
    sslcommerz: {
        storeId: string;
        storePassword: string;
        sandbox: boolean;
        isLive: boolean;
        initUrl: string;
        validationUrl: string;
    };
    bkash: {
        appKey: string;
        appSecret: string;
        username: string;
        password: string;
        sandbox: boolean;
        baseUrl: string;
    };
    nagad: {
        merchantId: string;
        publicKey: string;
        privateKey: string;
        sandbox: boolean;
        baseUrl: string;
    };
};
//# sourceMappingURL=env.d.ts.map