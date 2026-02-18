// Church Information Section for Registration Form
// Contains fields: churchName, pastor.fullName, pastor.phone

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister } from 'react-hook-form';
import { RegistrationFormData } from '../../../schemas/registration.schema';

interface ChurchInfoSectionProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  dirtyFields: FieldNamesMarkedBoolean<RegistrationFormData>;
  isSubmitted: boolean;
  disabled?: boolean;
}

export const ChurchInfoSection: React.FC<ChurchInfoSectionProps> = ({
  register,
  errors,
  dirtyFields,
  isSubmitted,
  disabled = false,
}) => {
  const shouldShowError = (fieldDirty?: boolean) => isSubmitted || fieldDirty;
  const { ref: churchNameRef, ...churchNameField } = register('churchName');
  const { ref: pastorNameRef, ...pastorNameField } = register('pastor.fullName');
  const { ref: pastorPhoneRef, ...pastorPhoneField } = register('pastor.phone');
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
          invalid={!!errors.churchName && shouldShowError(dirtyFields.churchName)}
          disabled={disabled}
        />
        {shouldShowError(dirtyFields.churchName) && (
          <FormFeedback>{errors.churchName?.message}</FormFeedback>
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
              invalid={!!errors.pastor?.fullName && shouldShowError(dirtyFields.pastor?.fullName)}
              disabled={disabled}
            />
            {shouldShowError(dirtyFields.pastor?.fullName) && (
              <FormFeedback>{errors.pastor?.fullName?.message}</FormFeedback>
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
              invalid={!!errors.pastor?.phone && shouldShowError(dirtyFields.pastor?.phone)}
              disabled={disabled}
            />
            {shouldShowError(dirtyFields.pastor?.phone) && (
              <FormFeedback>{errors.pastor?.phone?.message}</FormFeedback>
            )}
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};
