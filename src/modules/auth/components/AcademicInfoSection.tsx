// Academic Information Section for Registration Form
// Contains fields: academicLevel, enrollmentType

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { RegistrationFormData } from '../../../schemas/registration.schema';
import { 
  ACADEMIC_LEVEL_OPTIONS, 
  ENROLLMENT_TYPE_OPTIONS 
} from '../../../constants/registration.constants';

interface AcademicInfoSectionProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  disabled?: boolean;
}

export const AcademicInfoSection: React.FC<AcademicInfoSectionProps> = ({
  register,
  errors,
  disabled = false,
}) => {
  return (
    <>
      <h5 className="mb-3 mt-4 text-primary">
        <i className="bi bi-mortarboard me-2"></i>
        Información Académica
      </h5>

      <Row>
        <Col md={6}>
          <FormGroup>
            <Label for="academicLevel">Nivel Académico *</Label>
            <Input
              type="select"
              id="academicLevel"
              {...register('academicLevel')}
              invalid={!!errors.academicLevel}
              disabled={disabled}
            >
              {ACADEMIC_LEVEL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            <FormFeedback>{String(errors.academicLevel?.message || '')}</FormFeedback>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="enrollmentType">Tipo de Inscripción *</Label>
            <Input
              type="select"
              id="enrollmentType"
              {...register('enrollmentType')}
              invalid={!!errors.enrollmentType}
              disabled={disabled}
            >
              {ENROLLMENT_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            <FormFeedback>{String(errors.enrollmentType?.message || '')}</FormFeedback>
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};
