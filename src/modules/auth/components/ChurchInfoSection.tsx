// Church Information Section for Registration Form
// Contains fields: churchName, pastor.fullName, pastor.phone

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { FieldErrors, FieldNamesMarkedBoolean, Path, UseFormRegister } from 'react-hook-form';
import { RegistrationFormData, StudentProfileFormData } from '../../../schemas/registration.schema';

interface ChurchInfoSectionProps<TFormValues extends StudentProfileFormData> {
  register: UseFormRegister<TFormValues>;
  errors: FieldErrors<TFormValues>;
  dirtyFields: FieldNamesMarkedBoolean<TFormValues>;
  isSubmitted: boolean;
  disabled?: boolean;
}

export const ChurchInfoSection = <TFormValues extends StudentProfileFormData = RegistrationFormData>({
  register,
  errors,
  dirtyFields,
  isSubmitted,
  disabled = false,
}: ChurchInfoSectionProps<TFormValues>) => {
  const typedErrors = errors as FieldErrors<StudentProfileFormData>;
  const typedDirtyFields = dirtyFields as FieldNamesMarkedBoolean<StudentProfileFormData>;
  const shouldShowError = (fieldDirty?: boolean) => isSubmitted || fieldDirty;
  const { ref: churchNameRef, ...churchNameField } = register('churchName' as Path<TFormValues>);
  const { ref: pastorNameRef, ...pastorNameField } = register('pastor.fullName' as Path<TFormValues>);
  const { ref: pastorPhoneRef, ...pastorPhoneField } = register('pastor.phone' as Path<TFormValues>);
  return (
    <>
      <h5 className="mb-3 mt-4 text-primary">
        <i className="bi bi-building me-2"></i>
        Información de la Iglesia
      </h5>

      <FormGroup>
        <Label for="churchName">Nombre de la Iglesia *</Label>
        <Input
          type="text"
          id="churchName"
          placeholder="Ministerio Oasis de Amor"
          {...churchNameField}
          innerRef={churchNameRef}
          invalid={!!typedErrors.churchName && shouldShowError(typedDirtyFields.churchName)}
          disabled={disabled}
        />
        {shouldShowError(typedDirtyFields.churchName) && (
          <FormFeedback>{String(typedErrors.churchName?.message || '')}</FormFeedback>
        )}
      </FormGroup>

      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for="pastorFullName">Nombre del Pastor/a *</Label>
            <Input
              type="text"
              id="pastorFullName"
              placeholder="Pastor Juan Rodríguez"
              {...pastorNameField}
              innerRef={pastorNameRef}
              invalid={!!typedErrors.pastor?.fullName && shouldShowError(typedDirtyFields.pastor?.fullName)}
              disabled={disabled}
            />
            {shouldShowError(typedDirtyFields.pastor?.fullName) && (
              <FormFeedback>{String(typedErrors.pastor?.fullName?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="pastorPhone">Teléfono del Pastor/a</Label>
            <Input
              type="tel"
              id="pastorPhone"
              placeholder="8091234567"
              {...pastorPhoneField}
              innerRef={pastorPhoneRef}
              invalid={!!typedErrors.pastor?.phone && shouldShowError(typedDirtyFields.pastor?.phone)}
              disabled={disabled}
            />
            {shouldShowError(typedDirtyFields.pastor?.phone) && (
              <FormFeedback>{String(typedErrors.pastor?.phone?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};
