import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import Modal from './Modal';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: string;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && data && canvasRef.current) {
      // FIX: Use appropriate colors based on the dark/light theme context for better QR code readability.
      const isDarkMode = document.documentElement.classList.contains('dark');
      const darkColor = isDarkMode ? '#FFFFFF' : '#111827';
      const lightColor = isDarkMode ? '#1f2937' : '#FFFFFF'; // gray-800 for dark bg
      
      QRCode.toCanvas(canvasRef.current, data, { width: 256, margin: 2, color: { dark: darkColor, light: lightColor } }, (error) => {
        if (error) console.error("Error generating QR Code:", error);
      });
    }
  }, [isOpen, data]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Código QR de la Venta">
      <div className="flex flex-col items-center justify-center p-4">
        <canvas ref={canvasRef} />
        <p className="mt-4 text-sm text-center text-slate-600 dark:text-slate-400">
          Escanea este código para ver los detalles.
        </p>
      </div>
    </Modal>
  );
};

export default QrCodeModal;