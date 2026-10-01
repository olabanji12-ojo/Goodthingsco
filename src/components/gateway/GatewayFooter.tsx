import React from 'react';
import { Footer } from '../homepage/footer/Footer';

interface GatewayFooterProps {
  className?: string;
}

export const GatewayFooter: React.FC<GatewayFooterProps> = ({ className = '' }) => {
  return <Footer className={className} />;
};

export default GatewayFooter;
