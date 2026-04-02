import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { IUser } from '../../models';
import { PDFHeader } from './layout/PDFHeader';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontFamily: 'Helvetica-Bold',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableColSmall: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableColLarge: {
    width: '35%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 5,
    fontSize: 8,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
});

interface UserListPdfDocumentProps {
  users: IUser[];
  title?: string;
}

export const UserListPdfDocument: React.FC<UserListPdfDocumentProps> = ({ users, title = "Reporte de Usuarios" }) => {
  const students = users.filter(u => u.role === 'student' && !u.isTeacher).length;
  const teachers = users.filter(u => u.isTeacher).length;
  const actives = users.filter(u => u.isActive).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader />
        
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{students}</Text>
            <Text style={styles.statLabel}>ESTUDIANTES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{teachers}</Text>
            <Text style={styles.statLabel}>DOCENTES</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{actives}</Text>
            <Text style={styles.statLabel}>ACTIVOS</Text>
          </View>
        </View>

        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColLarge}>
              <Text style={styles.tableCellHeader}>Nombre Completo</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Teléfono</Text>
            </View>
            <View style={styles.tableColSmall}>
              <Text style={styles.tableCellHeader}>Rol</Text>
            </View>
            <View style={styles.tableColSmall}>
              <Text style={styles.tableCellHeader}>Estado</Text>
            </View>
            <View style={styles.tableColSmall}>
              <Text style={styles.tableCellHeader}>Clases</Text>
            </View>
          </View>

          {/* Rows */}
          {users.map((user, i) => (
            <View key={user.id || i} style={styles.tableRow} wrap={false}>
              <View style={styles.tableColLarge}>
                <Text style={styles.tableCell}>{user.firstName} {user.lastName}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{user.phone || 'N/A'}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{user.isTeacher ? 'Profesor' : (user.role === 'admin' ? 'Admin' : 'Estudiante')}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{user.isActive ? 'Activo' : 'Inactivo'}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>
                   {user.role === 'student' ? (user.enrolledClassrooms?.length || 0) : (user.teachingClassrooms?.length || 0)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
