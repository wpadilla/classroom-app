import { BaseModel } from "./interfaces/BaseModel";
import { IMedia, IMediaFile } from "./mediaModel";

export type PaymentTypes = 'card' | 'transfer' | 'cash'
export interface IPayment extends BaseModel {
    type: PaymentTypes;
    date: Date;
    amount: number;
    currency?: string;
    comment?: string;
    media?: IMedia;
    author?: string; // ref to user who created the payment
}

export const paymentTypes: PaymentTypes[] = ['card', 'transfer', 'cash']
export const paymentTypeLabels: Record<PaymentTypes, string> = {
    card: 'Tarjeta',
    transfer: 'Transferencia',
    cash: 'Efectivo'
}
