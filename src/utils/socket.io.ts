import { Socket } from "socket.io-client";

export const DEV_SOCKET_URL = 'http://localhost:3000'
// export const PROD_SOCKET_URL = 'http://165.232.158.16'
export const PROD_SOCKET_URL = 'https://www.betuel-promotions.xyz'
export const CONNECTED_EVENT = 'connect'
export const onSocketOnce = (socket: Socket, eventName: string, callback: (data: any) => any) => {
    if (socket) {
        console.log('event:', eventName);
        socket.removeAllListeners(eventName);
        socket.once(eventName, callback)
        // socket.on(eventName, callback);
    }
};
