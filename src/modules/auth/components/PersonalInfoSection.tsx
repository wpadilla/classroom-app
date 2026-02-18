// Personal Information Section for Registration Form
// Contains fields: firstName, lastName, documentType, documentNumber, phone, email

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { RegistrationFormData } from '../../../schemas/registration.schema';
import { DOCUMENT_TYPE_OPTIONS, COUNTRIES } from '../../../constants/registration.constants';

interface PersonalInfoSectionProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  disabled?: boolean;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  register,
  errors,
  watch,
  setValue,
  disabled = false,
}) => {
  const documentType = watch('documentType');

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
              {...register('firstName')}
              invalid={!!errors.firstName}
              disabled={disabled}
            />
            <FormFeedback>{errors.firstName?.message}</FormFeedback>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="lastName">Apellido *</Label>
            <Input
              type="text"
              id="lastName"
              placeholder="Pérez"
              {...register('lastName')}
              invalid={!!errors.lastName}
              disabled={disabled}
            />
            <FormFeedback>{errors.lastName?.message}</FormFeedback>
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
              {...register('documentType')}
              invalid={!!errors.documentType}
              disabled={disabled}
            >
              {DOCUMENT_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            <FormFeedback>{String(errors.documentType?.message || '')}</FormFeedback>
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
              {...register('documentNumber')}
              invalid={!!errors.documentNumber}
              disabled={disabled}
            />
            <FormFeedback>{String(errors.documentNumber?.message || '')}</FormFeedback>
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
              {...register('phone')}
              invalid={!!errors.phone}
              disabled={disabled}
            />
            <FormFeedback>{String(errors.phone?.message || '')}</FormFeedback>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="country">País *</Label>
            <Input
              type="select"
              id="country"
              {...register('country')}
              invalid={!!errors.country}
              disabled={disabled}
            >
              {COUNTRIES.map(country => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </Input>
            <FormFeedback>{String(errors.country?.message || '')}</FormFeedback>
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
          {...register('email')}
          invalid={!!errors.email}
          disabled={disabled}
        />
        <FormFeedback>{String(errors.email?.message || '')}</FormFeedback>
      </FormGroup>
    </>
  );
};
