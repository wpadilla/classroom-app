// PaymentHandler.tsx
import React, { useEffect, useState } from "react";
import {
  Button,
  Input,
  Select,
  Option,
  Textarea,
  CardFooter,
  Card,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { IPayment, paymentTypeLabels } from "@/models/PaymentModel";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { PAYMENT_CONSTANTS } from "@/constants/payment.constants";
import {
  CommonConfirmActions,
  CommonConfirmActionsDataTypes,
  ICustomComponentOverlay,
} from "@/models/common";
import { useConfirmAction } from "@/hooks/useConfirmActionHook";
import MediaHandler, { IMediaHandled } from "./MediaHandler";
import { IMedia } from "@/models/mediaModel";
import { AppImage } from "@/components/AppImage";
import { CardBody, CardHeader, Typography } from "@material-tailwind/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import SelectControl from "@/components/SelectControl";
import FormControl from "@/components/FormControl";
import { InfoCardItem } from "@/components/InfoCardItem";
import { BiDollar, BiEdit, BiSave, BiTrash } from "react-icons/bi";
import { FaRegSave } from "react-icons/fa";
import { useAuth } from "@/context/authContext";
import { BlobProviderParams, PDFDownloadLink } from "@react-pdf/renderer";
import PaymentPDF from "@/components/pdf/PaymentsPdfTemplate";
import { IClient } from "@/models/clientModel";
import { IEvent } from "@/models/excursionModel";
import { ComponentOverlay } from "@/components/ComponentOverlay";
import { useUserCurrency, getCurrencySymbol } from "@/utils/currency.utils";
import PaymentsPdfTemplate from "@/components/pdf/templates/PaymentsPdfTemplate";

interface PaymentHandlerProps {
  client?: IClient;
  excursion?: IEvent;
  enableAddPayment?: boolean;
  payments: IPayment[];
  onChangePayment: (payments: IPayment[]) => any;
  onDeletePayment: (payment: IPayment) => any;
  overlay?: ICustomComponentOverlay;
  /** Currency code for payments (e.g., 'USD', 'DOP'). Falls back to organization currency if not provided */
  currency?: string;
}

export const emptyPayment: IPayment = {
  type: "cash",
  date: new Date(),
  amount: 0,
  comment: "",
  media: undefined,
};

const PaymentHandler: React.FC<PaymentHandlerProps> = ({
  client,
  excursion,
  payments,
  onDeletePayment,
  onChangePayment,
  overlay,
  currency: currencyProp,
}) => {
  const { user } = useAuth();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(emptyPayment);

  // Use currency prop if provided, otherwise use organization currency
  const { currency: orgCurrency, currencySymbol: orgSymbol } = useUserCurrency();
  const paymentCurrency = currencyProp || orgCurrency;
  const paymentSymbol = currencyProp ? getCurrencySymbol(currencyProp) : orgSymbol;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    getValues,
    reset,
  } = useForm<IPayment>({ mode: "all", defaultValues: emptyPayment });

  const currentPayment = useWatch({ control });

  const onConfirmAction = (
    type?: CommonConfirmActions,
    data?: CommonConfirmActionsDataTypes<IPayment>
  ) => {
    switch (type) {
      case "delete":
        handleOnDelete(data as IPayment);
        break;
    }
  };

  const onDeniedAction = (
    type?: CommonConfirmActions,
    data?: CommonConfirmActionsDataTypes<IPayment>
  ) => { };

  const { handleSetActionToConfirm, resetActionToConfirm, ConfirmDialog } = useConfirmAction<
    CommonConfirmActions,
    CommonConfirmActionsDataTypes<IPayment>
  >(onConfirmAction, onDeniedAction);

  const handleMedia = (media: IMediaHandled) => {
    const image = media.images && media.images[0];
    setValue("media", image as IMedia);
  };

  const addOrUpdatePayment: SubmitHandler<IPayment> = (payment) => {
    let paymentsData = structuredClone(payments);

    if (payment._id) {
      paymentsData = paymentsData.map((item) => (item._id === payment._id ? payment : item));
    } else {
      paymentsData = [...paymentsData, payment];
    }

    onChangePayment(paymentsData);
    reset(emptyPayment);
  };

  const startEditing = (index: number) => {
    const payment = payments[index];
    reset(payment);
  };

  const cancelEditing = () => {
    reset(emptyPayment);
  };

  const handleOnDelete = (p: IPayment) => {
    onDeletePayment(p);
  };

  const handleClosePaymentForm = () => {
    reset(emptyPayment);
    setInitialFormData(emptyPayment);
    overlay?.handler?.();
  };

  const handleFormSubmit = async (payment: IPayment) => {
    await addOrUpdatePayment(payment);
    setInitialFormData(emptyPayment);
    reset(emptyPayment);
  };

  const content = (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
        <input name="_id" disabled type="hidden" />
        <div className="flex gap-4">
          <SelectControl
            name="type"
            control={control}
            label="Tipo de Pago"
            options={PAYMENT_CONSTANTS.PAYMENT_TYPES.map((type) => ({
              label: paymentTypeLabels[type],
              value: type,
            }))}
            rules={{
              required: "El tipo de pago es requerido",
            }}
            className={"w-full"}
          />
          <FormControl
            name="amount"
            control={control}
            type={"number"}
            label="Cantidad"
            rules={{
              required: "La cantidad es obligatoria",
              min: { value: 1, message: "Seleccione un tipo de pago" },
            }}
            className={"w-full"}
          />
        </div>
        <div className="flex flex-col gap-8">
          <FormControl
            name="comment"
            control={control}
            label="Comentario (Opcional)"
            type="textarea"
            rules={{
              minLength: {
                value: 3,
                message: "El comentario debe tener al menos 3 caracteres",
              },
            }}
          />
          <MediaHandler
            tags={["payment"]}
            onChange={handleMedia}
            medias={currentPayment.media ? [currentPayment.media as IMedia] : []}
            handle={{ images: true }}
            enableSingleSelection={true}
            disableUpload
            customMediaLabels={{
              images: "Comprobante",
            }}
          />
        </div>
      </form>
      {/* <PaymentPDF title={excursion?.title} client={client} payments={payments} user={user} /> */}

      <div className="flex justify-between">
        <Typography variant="h5">Todos los pagos</Typography>
        <PDFDownloadLink
          document={
            <PaymentsPdfTemplate
              title={excursion?.title}
              client={client}
              payments={payments}
              user={user}
            />
          }
          fileName={`pagos_${client?.firstName || excursion?.title || "cliente"}.pdf`}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Guardar PDF
        </PDFDownloadLink>
      </div>

      {/* Total de Pagos */}
      {payments.length > 0 && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <Typography variant="h6" className="font-semibold text-green-900">
              Total Pagado
            </Typography>
            <Typography variant="h5" className="font-bold text-green-900">
              {paymentSymbol}
              {payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
            </Typography>
          </div>
          <Typography variant="small" className="mt-1 text-green-700">
            {payments.length} {payments.length === 1 ? 'pago procesado' : 'pagos procesados'}
          </Typography>
        </div>
      )}

      <div className="flex items-end gap-4 overflow-x-auto pb-2">
        {payments.map((payment, index) => (
          <InfoCardItem
            icon={<BiDollar className="h-4 w-4 text-white" />}
            key={index}
            medias={payment.media ? [payment.media] : undefined}
            subtitle={paymentTypeLabels[payment.type] || payment.type}
            title={`${paymentSymbol}${payment.amount.toLocaleString()}`}
            description={payment.comment}
            actions={[
              {
                icon: <BiEdit className="h-5 w-5" />,
                text: "Editar",
                color: "blue",
                onClick: () => startEditing(index),
              },
              {
                icon: <BiTrash className="h-5 w-5" />,
                text: "Eliminar",
                color: "red",
                onClick: () => handleSetActionToConfirm("delete")(payment),
              },
            ]}
          />
        ))}
      </div>

      <ConfirmDialog />
    </div>
  );

  return overlay ? (
    <ComponentOverlay
      {...overlay}
      handler={handleClosePaymentForm}
      title={getValues("_id") ? "Editar Pago" : "Agregar Pago"}
      size={overlay.size || 700}
      detectChanges={{
        initialData: initialFormData,
        currentData: currentPayment,
        watch: setHasUnsavedChanges,
      }}
      footer={(closeOverlay) => (
        <div className="flex w-full items-center justify-between">
          <Button size="lg" color="red" onClick={closeOverlay}>
            Cerrar
          </Button>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-50 px-4 py-2">
              <Typography variant="small" className="font-semibold text-blue-900">
                Moneda: {paymentCurrency} {paymentSymbol}
              </Typography>
            </div>
            <Button
              size="lg"
              color="blue"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={!hasUnsavedChanges}
            >
              {getValues("_id") ? "Guardar Cambios" : "Agregar Pago"}
            </Button>
          </div>
        </div>
      )}
    >
      {overlay.open && content}
    </ComponentOverlay>
  ) : (
    content
  );
};

export default PaymentHandler;
