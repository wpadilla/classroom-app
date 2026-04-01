// Personal Information Section for Registration Form
// Contains fields: firstName, lastName, documentType, documentNumber, phone, email

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback, Button } from 'reactstrap';
import { FieldErrors, FieldNamesMarkedBoolean, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { RegistrationFormData, StudentProfileFormData } from '../../../schemas/registration.schema';
import { DOCUMENT_TYPE_OPTIONS, COUNTRIES } from '../../../constants/registration.constants';

interface IProfilePhotoSectionProps {
  previewUrl?: string;
  errorMessage?: string;
  inputRef: React.RefObject<HTMLInputElement>;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPickPhoto: () => void;
  onTakePhoto: () => void;
}

interface PersonalInfoSectionProps<TFormValues extends StudentProfileFormData> {
  register: UseFormRegister<TFormValues>;
  errors: FieldErrors<TFormValues>;
  dirtyFields: FieldNamesMarkedBoolean<TFormValues>;
  isSubmitted: boolean;
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  disabled?: boolean;
  profilePhotoSection?: IProfilePhotoSectionProps;
}

export const PersonalInfoSection = <TFormValues extends StudentProfileFormData = RegistrationFormData>({
  register,
  errors,
  dirtyFields,
  isSubmitted,
  watch,
  setValue,
  disabled = false,
  profilePhotoSection,
}: PersonalInfoSectionProps<TFormValues>) => {
  const typedErrors = errors as FieldErrors<StudentProfileFormData>;
  const typedDirtyFields = dirtyFields as FieldNamesMarkedBoolean<StudentProfileFormData>;
  const documentType = watch('documentType' as Path<TFormValues>);
  const shouldShowError = (fieldDirty?: boolean) => isSubmitted || fieldDirty;
  const { ref: firstNameRef, ...firstNameField } = register('firstName' as Path<TFormValues>);
  const { ref: lastNameRef, ...lastNameField } = register('lastName' as Path<TFormValues>);
  const { ref: documentTypeRef, ...documentTypeField } = register('documentType' as Path<TFormValues>);
  const { ref: documentNumberRef, ...documentNumberField } = register('documentNumber' as Path<TFormValues>);
  const { ref: phoneRef, ...phoneField } = register('phone' as Path<TFormValues>);
  const { ref: countryRef, ...countryField } = register('country' as Path<TFormValues>);
  const { ref: emailRef, ...emailField } = register('email' as Path<TFormValues>);

  return (
    <>
      <h5 className="mb-3 text-primary">
        <i className="bi bi-person-badge me-2"></i>
        Información Personal
      </h5>

      {profilePhotoSection && (
        <div className="mb-3 rounded-4 border bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {profilePhotoSection.previewUrl ? (
                <img
                  src={profilePhotoSection.previewUrl}
                  alt="Foto de perfil"
                  className="h-[64px] w-[64px] rounded-circle border object-cover"
                />
              ) : (
                <div
                  className="inline-flex h-[64px] w-[64px] items-center justify-center rounded-circle bg-secondary"
                >
                  <i className="bi bi-person-fill text-white fs-3"></i>
                </div>
              )}

              <div>
                <p className="mb-1 text-sm font-semibold text-dark">Foto de perfil</p>
                <p className="mb-0 text-xs text-muted">
                  Compacta tu perfil con una foto clara.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                ref={profilePhotoSection.inputRef}
                type="file"
                accept="image/*"
                onChange={profilePhotoSection.onChange}
                style={{ display: 'none' }}
              />

              <Button
                type="button"
                color="outline-primary"
                size="sm"
                onClick={profilePhotoSection.onPickPhoto}
                disabled={profilePhotoSection.disabled}
              >
                <i className="bi bi-upload me-1"></i>
                Subir
              </Button>
              <Button
                type="button"
                color="outline-primary"
                size="sm"
                onClick={profilePhotoSection.onTakePhoto}
                disabled={profilePhotoSection.disabled}
              >
                <i className="bi bi-camera me-1"></i>
                Tomar
              </Button>
            </div>
          </div>

          {profilePhotoSection.errorMessage && (
            <p className="mb-0 mt-2 small text-danger">{profilePhotoSection.errorMessage}</p>
          )}
        </div>
      )}

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
              invalid={!!typedErrors.firstName && shouldShowError(typedDirtyFields.firstName)}
              disabled={disabled}
            />
            {shouldShowError(typedDirtyFields.firstName) && (
              <FormFeedback>{String(typedErrors.firstName?.message || '')}</FormFeedback>
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
              invalid={!!typedErrors.lastName && shouldShowError(typedDirtyFields.lastName)}
              disabled={disabled}
            />
            {shouldShowError(typedDirtyFields.lastName) && (
              <FormFeedback>{String(typedErrors.lastName?.message || '')}</FormFeedback>
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
              invalid={!!typedErrors.documentType && shouldShowError(typedDirtyFields.documentType)}
              disabled={disabled}
            >
              {DOCUMENT_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            {shouldShowError(typedDirtyFields.documentType) && (
              <FormFeedback>{String(typedErrors.documentType?.message || '')}</FormFeedback>
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
              invalid={!!typedErrors.documentNumber && shouldShowError(typedDirtyFields.documentNumber)}
              disabled={disabled}
            />
            {shouldShowError(typedDirtyFields.documentNumber) && (
              <FormFeedback>{String(typedErrors.documentNumber?.message || '')}</FormFeedback>
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
              invalid={!!typedErrors.phone && shouldShowError(typedDirtyFields.phone)}
              disabled={disabled}
            />
            {shouldShowError(typedDirtyFields.phone) && (
              <FormFeedback>{String(typedErrors.phone?.message || '')}</FormFeedback>
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
              invalid={!!typedErrors.country && shouldShowError(typedDirtyFields.country)}
              disabled={disabled}
            >
              {COUNTRIES.map(country => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </Input>
            {shouldShowError(typedDirtyFields.country) && (
              <FormFeedback>{String(typedErrors.country?.message || '')}</FormFeedback>
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
          invalid={!!typedErrors.email && shouldShowError(typedDirtyFields.email)}
          disabled={disabled}
        />
        {shouldShowError(typedDirtyFields.email) && (
          <FormFeedback>{String(typedErrors.email?.message || '')}</FormFeedback>
        )}
      </FormGroup>
    </>
  );
};
