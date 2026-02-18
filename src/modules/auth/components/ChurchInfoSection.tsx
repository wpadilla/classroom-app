// Church Information Section for Registration Form
// Contains fields: churchName, pastor.fullName, pastor.phone

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { RegistrationFormData } from '../../../schemas/registration.schema';

interface ChurchInfoSectionProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  disabled?: boolean;
}

export const ChurchInfoSection: React.FC<ChurchInfoSectionProps> = ({
  register,
  errors,
  disabled = false,
}) => {
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
          {...register('churchName')}
          invalid={!!errors.churchName}
          disabled={disabled}
        />
        <FormFeedback>{errors.churchName?.message}</FormFeedback>
      </FormGroup>

      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for="pastorFullName">Nombre del Pastor/a *</Label>
            <Input
              type="text"
              id="pastorFullName"
              placeholder="Pastor Juan Rodríguez"
              {...register('pastor.fullName')}
              invalid={!!errors.pastor?.fullName}
              disabled={disabled}
            />
            <FormFeedback>{errors.pastor?.fullName?.message}</FormFeedback>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="pastorPhone">Teléfono del Pastor/a *</Label>
            <Input
              type="tel"
              id="pastorPhone"
              placeholder="8091234567"
              {...register('pastor.phone')}
              invalid={!!errors.pastor?.phone}
              disabled={disabled}
            />
            <FormFeedback>{errors.pastor?.phone?.message}</FormFeedback>
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};
