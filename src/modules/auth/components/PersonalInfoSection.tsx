// Personal Information Section for Registration Form
// Contains fields: firstName, lastName, documentType, documentNumber, phone, email

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { RegistrationFormData } from '../../../schemas/registration.schema';
import { DOCUMENT_TYPE_OPTIONS, COUNTRIES } from '../../../constants/registration.constants';

interface PersonalInfoSectionProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  dirtyFields: FieldNamesMarkedBoolean<RegistrationFormData>;
  isSubmitted: boolean;
  watch: UseFormWatch<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  disabled?: boolean;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  register,
  errors,
  dirtyFields,
  isSubmitted,
  watch,
  setValue,
  disabled = false,
}) => {
  const documentType = watch('documentType');
  const shouldShowError = (fieldDirty?: boolean) => isSubmitted || fieldDirty;
  const { ref: firstNameRef, ...firstNameField } = register('firstName');
  const { ref: lastNameRef, ...lastNameField } = register('lastName');
  const { ref: documentTypeRef, ...documentTypeField } = register('documentType');
  const { ref: documentNumberRef, ...documentNumberField } = register('documentNumber');
  const { ref: phoneRef, ...phoneField } = register('phone');
  const { ref: countryRef, ...countryField } = register('country');
  const { ref: emailRef, ...emailField } = register('email');

  return (
    <>
      <h5 className="mb-3 text-primary">
        <i className="bi bi-person-badge me-2"></i>
        Información Personal
      </h5>

      {/* Name fields */}
      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for="firstName">Nombre *</Label>
            <Input
              type="text"
              id="firstName"
              placeholder="Juan"
              {...firstNameField}
              innerRef={firstNameRef}
              invalid={!!errors.firstName && shouldShowError(dirtyFields.firstName)}
              disabled={disabled}
            />
            {shouldShowError(dirtyFields.firstName) && (
              <FormFeedback>{errors.firstName?.message}</FormFeedback>
            )}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="lastName">Apellido *</Label>
            <Input
              type="text"
              id="lastName"
              placeholder="Pérez"
              {...lastNameField}
              innerRef={lastNameRef}
              invalid={!!errors.lastName && shouldShowError(dirtyFields.lastName)}
              disabled={disabled}
            />
            {shouldShowError(dirtyFields.lastName) && (
              <FormFeedback>{errors.lastName?.message}</FormFeedback>
            )}
          </FormGroup>
        </Col>
      </Row>

      {/* Document fields */}
      <Row>
        <Col md={4}>
          <FormGroup>
            <Label for="documentType">Tipo de Documento *</Label>
            <Input
              type="select"
              id="documentType"
              {...documentTypeField}
              innerRef={documentTypeRef}
              invalid={!!errors.documentType && shouldShowError(dirtyFields.documentType)}
              disabled={disabled}
            >
              {DOCUMENT_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            {shouldShowError(dirtyFields.documentType) && (
              <FormFeedback>{String(errors.documentType?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
        <Col md={8}>
          <FormGroup>
            <Label for="documentNumber">
              {documentType === 'NationalId' ? 'Cédula *' : 'Pasaporte *'}
            </Label>
            <Input
              type="text"
              id="documentNumber"
              placeholder={documentType === 'NationalId' ? '001-1234567-8' : 'AB1234567'}
              {...documentNumberField}
              innerRef={documentNumberRef}
              invalid={!!errors.documentNumber && shouldShowError(dirtyFields.documentNumber)}
              disabled={disabled}
            />
            {shouldShowError(dirtyFields.documentNumber) && (
              <FormFeedback>{String(errors.documentNumber?.message || '')}</FormFeedback>
            )}
            {documentType === 'NationalId' && (
              <small className="text-muted">Formato: XXX-XXXXXXX-X</small>
            )}
          </FormGroup>
        </Col>
      </Row>

      {/* Contact fields */}
      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for="phone">Teléfono / WhatsApp *</Label>
            <Input
              type="tel"
              id="phone"
              placeholder="8091234567"
              {...phoneField}
              innerRef={phoneRef}
              invalid={!!errors.phone && shouldShowError(dirtyFields.phone)}
              disabled={disabled}
            />
            {shouldShowError(dirtyFields.phone) && (
              <FormFeedback>{String(errors.phone?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="country">País *</Label>
            <Input
              type="select"
              id="country"
              {...countryField}
              innerRef={countryRef}
              invalid={!!errors.country && shouldShowError(dirtyFields.country)}
              disabled={disabled}
            >
              {COUNTRIES.map(country => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </Input>
            {shouldShowError(dirtyFields.country) && (
              <FormFeedback>{String(errors.country?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
      </Row>

      {/* Email */}
      <FormGroup>
        <Label for="email">Correo Electrónico (Opcional)</Label>
        <Input
          type="email"
          id="email"
          placeholder="correo@ejemplo.com"
          {...emailField}
          innerRef={emailRef}
          invalid={!!errors.email && shouldShowError(dirtyFields.email)}
          disabled={disabled}
        />
        {shouldShowError(dirtyFields.email) && (
          <FormFeedback>{String(errors.email?.message || '')}</FormFeedback>
        )}
      </FormGroup>
    </>
  );
};
