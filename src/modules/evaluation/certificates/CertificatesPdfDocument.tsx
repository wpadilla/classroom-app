import React from 'react';
import { Document, Image, Page, StyleSheet, View } from '@react-pdf/renderer';
import { CertificatePdfPage } from './certificate.types';

interface CertificatesPdfDocumentProps {
  certificates: CertificatePdfPage[];
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#ffffff',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

const CertificatesPdfDocument: React.FC<CertificatesPdfDocumentProps> = ({ certificates }) => {
  return (
    <Document
      title="Certificados"
      author="Academia de Ministros Oasis de Amor"
      subject="Certificados de finalizacion"
      creator="Classroom App"
      producer="Classroom App"
    >
      {certificates.map((certificate) => (
        <Page key={certificate.id} size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.imageContainer}>
            <Image src={certificate.imageSrc} style={styles.image} />
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default CertificatesPdfDocument;
