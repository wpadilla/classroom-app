// Academic Information Section for Registration Form
// Contains fields: academicLevel, enrollmentType

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import { FieldErrors, FieldNamesMarkedBoolean, UseFormRegister } from 'react-hook-form';
import { RegistrationFormData } from '../../../schemas/registration.schema';
import { 
  ACADEMIC_LEVEL_OPTIONS, 
  ENROLLMENT_TYPE_OPTIONS 
} from '../../../constants/registration.constants';

interface AcademicInfoSectionProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  dirtyFields: FieldNamesMarkedBoolean<RegistrationFormData>;
  isSubmitted: boolean;
  disabled?: boolean;
}

export const AcademicInfoSection: React.FC<AcademicInfoSectionProps> = ({
  register,
  errors,
  dirtyFields,
  isSubmitted,
  disabled = false,
}) => {
  const shouldShowError = (fieldDirty?: boolean) => isSubmitted || fieldDirty;
  const { ref: academicLevelRef, ...academicLevelField } = register('academicLevel');
  const { ref: enrollmentTypeRef, ...enrollmentTypeField } = register('enrollmentType');
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
              {...academicLevelField}
              innerRef={academicLevelRef}
              invalid={!!errors.academicLevel && shouldShowError(dirtyFields.academicLevel)}
              disabled={disabled}
            >
              {ACADEMIC_LEVEL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            {shouldShowError(dirtyFields.academicLevel) && (
              <FormFeedback>{String(errors.academicLevel?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="enrollmentType">Tipo de Inscripción *</Label>
            <Input
              type="select"
              id="enrollmentType"
              {...enrollmentTypeField}
              innerRef={enrollmentTypeRef}
              invalid={!!errors.enrollmentType && shouldShowError(dirtyFields.enrollmentType)}
              disabled={disabled}
            >
              {ENROLLMENT_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            {shouldShowError(dirtyFields.enrollmentType) && (
              <FormFeedback>{String(errors.enrollmentType?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};
