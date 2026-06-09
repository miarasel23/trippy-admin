import React from 'react';
import { useTranslation } from '../utilities/translation';

export default function PriceSetAsPerKm() {
  const t = useTranslation();

  return (
    <div className="card w-100">
      <div className="card-header">
        <h3 className="card-title m-0">{t('priceSetAsPerKm')} List</h3>
      </div>
      <div className="card-body">
        <p className="text-muted">This page is a placeholder for setting prices per kilometer.</p>
      </div>
    </div>
  );
}
