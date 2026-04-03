import React from 'react';
import {
  Button,
  Col,
  Form,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
} from 'reactstrap';
import { IUser } from '../../../../models';
import { DocumentTypeValue, AcademicLevelValue } from '../../../../schemas/user.schema';

interface InfoTabProps {
  currentUser: IUser;
  photoPreview: string;
  uploadingPhoto: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  editMode: boolean;
  onSubmit: (data: any) => void;
  handleSubmit: (handler: any) => (e?: React.BaseSyntheticEvent) => void;
  errors: Record<string, any>;
  isDirty: boolean;
  saving: boolean;
  fields: {
    firstNameField: any;
    firstNameRef: any;
    lastNameField: any;
    lastNameRef: any;
    phoneField: any;
    phoneRef: any;
    emailField: any;
    emailRef: any;
    roleField: any;
    roleRef: any;
    isTeacherField: any;
    isTeacherRef: any;
    isActiveField: any;
    isActiveRef: any;
    documentTypeField: any;
    documentTypeRef: any;
    documentNumberField: any;
    documentNumberRef: any;
    countryField: any;
    countryRef: any;
    churchNameField: any;
    churchNameRef: any;
    academicLevelField: any;
    academicLevelRef: any;
    pastorNameField: any;
    pastorNameRef: any;
    pastorPhoneField: any;
    pastorPhoneRef: any;
    passwordField: any;
    passwordRef: any;
  };
  documentTypeOptions: { value: DocumentTypeValue; label: string }[];
  academicLevelOptions: { value: AcademicLevelValue; label: string }[];
  countries: { value: string; label: string }[];
}

const InfoTab: React.FC<InfoTabProps> = ({
  currentUser,
  photoPreview,
  uploadingPhoto,
  fileInputRef,
  onPhotoChange,
  onStartEdit,
  onCancelEdit,
  editMode,
  onSubmit,
  handleSubmit,
  errors,
  isDirty,
  saving,
  fields,
  documentTypeOptions,
  academicLevelOptions,
  countries,
}) => {
  return (
    <Row>
      <Col md={3} className="text-center mb-3">
        <div className="position-relative d-inline-block">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile"
              className="rounded-circle border"
              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="rounded-circle bg-secondary d-inline-flex align-items-center justify-content-center"
              style={{ width: '150px', height: '150px' }}
            >
              <i className="bi bi-person-fill text-white" style={{ fontSize: '4rem' }}></i>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            style={{ display: 'none' }}
          />

          <Button
            color="primary"
            size="sm"
            className="position-absolute bottom-0 end-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <Spinner size="sm" />
            ) : (
              <i className="bi bi-camera"></i>
            )}
          </Button>
        </div>
        <div className="mt-2">
          <small className="text-muted">ID: {currentUser.id.slice(0, 8)}...</small>
        </div>
      </Col>

      <Col md={9}>
        <div className="d-flex justify-content-end mb-3">
          {!editMode ? (
            <Button color="primary" size="sm" onClick={onStartEdit}>
              <i className="bi bi-pencil me-1"></i>
              Editar
            </Button>
          ) : (
            <Button color="secondary" size="sm" onClick={onCancelEdit}>
              Cancelar
            </Button>
          )}
        </div>

        <Form key={currentUser.id} onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Nombre</Label>
                <Input
                  {...fields.firstNameField}
                  innerRef={fields.firstNameRef}
                  invalid={!!errors.firstName}
                  disabled={!editMode}
                />
                <FormFeedback>{errors.firstName?.message}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Apellido</Label>
                <Input
                  {...fields.lastNameField}
                  innerRef={fields.lastNameRef}
                  invalid={!!errors.lastName}
                  disabled={!editMode}
                />
                <FormFeedback>{errors.lastName?.message}</FormFeedback>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Telefono</Label>
                <Input
                  {...fields.phoneField}
                  innerRef={fields.phoneRef}
                  invalid={!!errors.phone}
                  disabled={!editMode}
                />
                <FormFeedback>{errors.phone?.message}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  {...fields.emailField}
                  autoComplete='new-password'
                  innerRef={fields.emailRef}
                  invalid={!!errors.email}
                  disabled={!editMode}
                />
                <FormFeedback>{String(errors.email?.message || '')}</FormFeedback>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Rol</Label>
                <Input
                  type="select"
                  {...fields.roleField}
                  innerRef={fields.roleRef}
                  disabled={!editMode}
                >
                  <option value="student">Estudiante</option>
                  <option value="teacher">Profesor</option>
                  <option value="admin">Administrador</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup check className="mt-4">
                <Input
                  type="checkbox"
                  {...fields.isTeacherField}
                  innerRef={fields.isTeacherRef}
                  disabled={!editMode}
                />
                <Label check>Es Profesor</Label>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup check className="mt-4">
                <Input
                  type="checkbox"
                  {...fields.isActiveField}
                  innerRef={fields.isActiveRef}
                  disabled={!editMode}
                />
                <Label check>Activo</Label>
              </FormGroup>
            </Col>
          </Row>

          <hr className="my-3" />
          <h6 className="text-muted mb-3">Informacion Adicional</h6>
          <Row>
            <Col md={4}>
              <FormGroup>
                <Label>Tipo de Documento</Label>
                <Input
                  type="select"
                  {...fields.documentTypeField}
                  innerRef={fields.documentTypeRef}
                  disabled={!editMode}
                >
                  <option value="">Seleccionar...</option>
                  {documentTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Numero de Documento</Label>
                <Input
                  {...fields.documentNumberField}
                  innerRef={fields.documentNumberRef}
                  disabled={!editMode}
                  placeholder="000-0000000-0"
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label>Pais</Label>
                <Input
                  type="select"
                  {...fields.countryField}
                  innerRef={fields.countryRef}
                  disabled={!editMode}
                >
                  <option value="">Seleccionar...</option>
                  {countries.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Iglesia</Label>
                <Input
                  {...fields.churchNameField}
                  innerRef={fields.churchNameRef}
                  disabled={!editMode}
                  placeholder="Nombre de la iglesia"
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Nivel Academico</Label>
                <Input
                  type="select"
                  {...fields.academicLevelField}
                  innerRef={fields.academicLevelRef}
                  disabled={!editMode}
                >
                  <option value="">Seleccionar...</option>
                  {academicLevelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Nombre del Pastor</Label>
                <Input
                  {...fields.pastorNameField}
                  innerRef={fields.pastorNameRef}
                  disabled={!editMode}
                  placeholder="Nombre del pastor"
                />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Telefono del Pastor</Label>
                <Input
                  {...fields.pastorPhoneField}
                  innerRef={fields.pastorPhoneRef}
                  disabled={!editMode}
                  placeholder="Numero de telefono"
                />
              </FormGroup>
            </Col>
          </Row>

          {editMode && (
            <>
              <hr />
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Nueva Contrasena (dejar vacio para no cambiar)</Label>
                    <Input
                      type="password"
                      {...fields.passwordField}
                      innerRef={fields.passwordRef}
                      invalid={!!errors.password}
                      placeholder="••••••"
                      autoComplete='new-password'
                    />
                    <FormFeedback>{String(errors.password?.message || '')}</FormFeedback>
                  </FormGroup>
                </Col>
              </Row>
              <Button
                type="submit"
                color="success"
                disabled={saving || !isDirty}
              >
                {saving ? <Spinner size="sm" /> : <i className="bi bi-check me-1"></i>}
                Guardar Cambios
              </Button>
            </>
          )}
        </Form>
      </Col>
    </Row>
  );
};

export default InfoTab;
