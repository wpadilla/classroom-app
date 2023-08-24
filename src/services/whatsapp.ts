export const localPromotionsApi = "http://10.0.0.13:5000/api/";
export const whatsappPhone = "+18298937075";
export type PublicationTypes = "photo" | "story";
export type ECommerceTypes =
    | "facebook"
    | "instagram"
    | "corotos"
    | "flea"
    | "whatsapp"
    | "betueltravel"
    | "betueldance"
    | "betueltech";

export const ecommerceNames: { [N in ECommerceTypes]: string } = {
    facebook: "Facebook Marketplace",
    instagram: "Instagram",
    corotos: "Corotos",
    flea: "La Pulga Virtual",
    whatsapp: "Whatsapp Messenger",
    betueltravel: "Betuel Travel",
    betueltech: "Betuel Tech",
    betueldance: "Betuel Dance Shop",
};
export const getWhatsappMessageURL = (message: string) =>
    `https://wa.me/${whatsappPhone}?text=${encodeURI(message)}`;

export interface IWhatsappMessage {
    text?: string;
    photo?: Blob;
}


export const startWhatsappServices = async (
    start = true,
    sessionId: any,
    removeSession?: boolean
) => {
    try {
        return await fetch(`${process.env.REACT_APP_PROMOTION_API}whatsapp`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({start, sessionId, removeSession}),
        });
    } catch (e) {
        throw e;
    }
};


export const sendWhatsappMessage = async (
    sessionId: string,
    contacts: any[],
    message: IWhatsappMessage
) => {
    try {
        return await fetch(
            `${process.env.REACT_APP_PROMOTION_API}whatsapp/message`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId,
                    message,
                    contacts: contacts.filter((item) => !!item),
                    delay: 10,
                }),
            }
        );
    } catch (e) {
        throw e;
    }
};

export const getWhatsappSeedData = async (
    sessionId: string,
    seedType = "all"
) => {
    try {
        return await fetch(
            `${process.env.REACT_APP_PROMOTION_API}whatsapp/seed/${sessionId}/${seedType}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (e) {
        throw e;
    }
};
