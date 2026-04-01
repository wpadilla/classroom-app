// Academic Information Section for Registration Form
// Contains fields: academicLevel, enrollmentType

import React from 'react';
import { Row, Col, FormGroup, Label, Input, FormFeedback } from 'reactstrap';
import {
  FieldErrors,
  FieldNamesMarkedBoolean,
  Path,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { RegistrationFormData, StudentProfileFormData } from '../../../schemas/registration.schema';
import { ACADEMIC_LEVEL_OPTIONS } from '../../../constants/registration.constants';

interface IEnrollmentOption {
  value: string;
  label: string;
}

interface AcademicInfoSectionProps<TFormValues extends StudentProfileFormData> {
  register: UseFormRegister<TFormValues>;
  errors: FieldErrors<TFormValues>;
  dirtyFields: FieldNamesMarkedBoolean<TFormValues>;
  isSubmitted: boolean;
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  enrollmentOptions: IEnrollmentOption[];
  loadingEnrollmentOptions?: boolean;
  disabled?: boolean;
}

export const AcademicInfoSection = <TFormValues extends StudentProfileFormData = RegistrationFormData>({
  register,
  errors,
  dirtyFields,
  isSubmitted,
  watch,
  setValue,
  enrollmentOptions,
  loadingEnrollmentOptions = false,
  disabled = false,
}: AcademicInfoSectionProps<TFormValues>) => {
  const typedErrors = errors as FieldErrors<StudentProfileFormData>;
  const typedDirtyFields = dirtyFields as FieldNamesMarkedBoolean<StudentProfileFormData>;
  const shouldShowError = (fieldDirty?: boolean) => isSubmitted || fieldDirty;
  const { ref: academicLevelRef, ...academicLevelField } = register('academicLevel' as Path<TFormValues>);
  const { ref: enrollmentTypeRef, ...enrollmentTypeField } = register('enrollmentType' as Path<TFormValues>);
  const academicLevelValue = watch('academicLevel' as Path<TFormValues>) as string | undefined;
  const enrollmentTypeValue = watch('enrollmentType' as Path<TFormValues>) as string | undefined;

  React.useEffect(() => {
    if (loadingEnrollmentOptions || disabled || enrollmentOptions.length === 0) {
      return;
    }

    const hasMatchingOption = enrollmentOptions.some((option) => option.value === enrollmentTypeValue);
    if (hasMatchingOption) {
      return;
    }

    setValue('enrollmentType' as Path<TFormValues>, enrollmentOptions[0].value as never, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [disabled, enrollmentOptions, enrollmentTypeValue, loadingEnrollmentOptions, setValue]);

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
              value={academicLevelValue || ''}
              onChange={(event) => {
                academicLevelField.onChange(event);
                setValue('academicLevel' as Path<TFormValues>, event.target.value as never, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              invalid={!!typedErrors.academicLevel && shouldShowError(typedDirtyFields.academicLevel)}
              disabled={disabled}
            >
              {ACADEMIC_LEVEL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            {shouldShowError(typedDirtyFields.academicLevel) && (
              <FormFeedback>{String(typedErrors.academicLevel?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <Label for="enrollmentType">Programa *</Label>
            <Input
              type="select"
              id="enrollmentType"
              {...enrollmentTypeField}
              innerRef={enrollmentTypeRef}
              value={enrollmentTypeValue || ''}
              onChange={(event) => {
                enrollmentTypeField.onChange(event);
                setValue('enrollmentType' as Path<TFormValues>, event.target.value as never, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              invalid={!!typedErrors.enrollmentType && shouldShowError(typedDirtyFields.enrollmentType)}
              disabled={disabled || loadingEnrollmentOptions}
            >
              <option value="">
                {loadingEnrollmentOptions ? 'Cargando programas...' : 'Seleccione un programa'}
              </option>
              {enrollmentOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Input>
            {shouldShowError(typedDirtyFields.enrollmentType) && (
              <FormFeedback>{String(typedErrors.enrollmentType?.message || '')}</FormFeedback>
            )}
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};
