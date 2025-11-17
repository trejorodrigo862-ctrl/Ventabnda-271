

import React, { useState, useEffect } from 'react';

const FormattedInput = ({ label, value, onChange, name, type = 'number', isCurrency = false }) => {
    const [displayValue, setDisplayValue] = useState(value.toString());

    useEffect(() => {
        if (isCurrency) {
            const numValue = Number(value);
            setDisplayValue(isNaN(numValue) ? '' : numValue.toLocaleString('es-AR'));
        } else {
            setDisplayValue(value.toString());
        }
    }, [value, isCurrency]);

    const handleChange = (e) => {
        const rawValue = e.target.value;
        
        if (isCurrency) {
            const numericValue = parseInt(rawValue.replace(/\D/g, ''), 10);
            if (!isNaN(numericValue)) {
                setDisplayValue(numericValue.toLocaleString('es-AR'));
                onChange(numericValue);
            } else {
                setDisplayValue('');
                onChange(0);
            }
        } else {
            setDisplayValue(rawValue);
            onChange(type === 'number' ? Number(rawValue) : rawValue);
        }
    };
    
    if (type === 'date') {
        return (
             <div>
                <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                <input
                    type="date"
                    id={name}
                    name={name}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                />
            </div>
        );
    }

    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                {isCurrency && <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><span className="text-slate-500 sm:text-sm">$</span></div>}
                <input
                    type={isCurrency ? 'text' : 'number'}
                    id={name}
                    name={name}
                    value={displayValue}
                    onChange={handleChange}
                    min="0"
                    required
                    className={`block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md ${isCurrency ? 'pl-7' : ''}`}
                />
            </div>
        </div>
    );
};

export default FormattedInput;
