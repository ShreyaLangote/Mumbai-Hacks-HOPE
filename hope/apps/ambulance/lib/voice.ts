import { RetellWebClient } from "retell-client-js-sdk";

// Singleton instance to avoid creating multiple clients
let retellWebClient: RetellWebClient | null = null;

export const getRetellClient = (): RetellWebClient => {
    if (!retellWebClient) {
        retellWebClient = new RetellWebClient();
    }
    return retellWebClient;
};
