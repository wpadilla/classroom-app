import React, { useCallback, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import PaymentReceiptPdfTemplate, { PaymentReceiptPdfProps } from '../templates/PaymentReceiptPdfTemplate';

interface PaymentReceiptPdfDownloadButtonProps extends PaymentReceiptPdfProps {
  children?: React.ReactNode;
}

const PaymentReceiptPdfDownloadButton: React.FC<PaymentReceiptPdfDownloadButtonProps> = ({
  children,
  ...props
}) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const blob = await pdf(<PaymentReceiptPdfTemplate {...props} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${props.studentName.replace(/\s+/g, '-').toLowerCase()}-pagos.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating payment receipt PDF:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, props]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDownload();
    }
  }, [handleDownload]);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleDownload}
      onKeyDown={handleKeyDown}
      style={{
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <span style={{ color: '#999' }}>Generando PDF...</span>
      ) : (
        children || <span style={{ color: '#1976d2' }}>Descargar comprobante</span>
      )}
    </span>
  );
};

export default PaymentReceiptPdfDownloadButton;
