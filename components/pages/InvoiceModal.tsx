import React, { useEffect } from 'react';
import InvoiceDocument from './InvoiceDocument';
import { XMarkIcon, PrinterIcon } from '../icons/Icons';
import { Transaction, Customer, CompanyInfo } from '../../types';
import { useTranslations } from '../../contexts/LanguageContext';

interface InvoiceModalProps {
    transaction: Transaction;
    customer: Customer | undefined;
    companyInfo: CompanyInfo;
    onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, customer, companyInfo, onClose }) => {
    const { t } = useTranslations();
    
    useEffect(() => {
        // When the modal opens, add a class to the body to scope print styles
        document.body.classList.add('invoice-modal-open');
        // When the modal closes, remove the class
        return () => {
            document.body.classList.remove('invoice-modal-open');
        };
    }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

    const handlePrint = () => {
        // Use a timeout to ensure print styles are applied before the print dialog opens.
        // This helps prevent race conditions in some browsers, especially in complex UIs or slower environments.
        setTimeout(() => {
            window.print();
        }, 300);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 printable-container" aria-modal="true" role="dialog">
            <style>
                {`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    html, body {
                        height: initial !important;
                        overflow: initial !important;
                        -webkit-print-color-adjust: exact;
                    }

                    /* Hide everything except the printable container */
                    body.invoice-modal-open > #root > div > *:not(.printable-container) {
                        display: none !important;
                    }

                    .printable-container {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: none !important;
                    }
                    .printable-container > div {
                        width: 100% !important;
                        max-width: 100% !important;
                        max-height: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        display: block !important;
                        border-radius: 0 !important;
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .scrollable-content {
                        overflow: visible !important;
                        max-height: none !important;
                        display: block !important;
                    }
                }
                `}
            </style>
            <div className="bg-slate-100 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 bg-slate-200 border-b border-slate-300 flex justify-between items-center no-print">
                    <h3 className="text-lg font-bold text-slate-800">{t('invoicePreview')}</h3>
                    <div className="flex items-center space-x-2">
                         <button onClick={handlePrint} className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                            <PrinterIcon className="w-5 h-5" />
                            <span>{t('print')}</span>
                        </button>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-300">
                            <XMarkIcon className="w-6 h-6 text-slate-700" />
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto scrollable-content">
                    <InvoiceDocument
                        transaction={transaction}
                        customer={customer}
                        companyInfo={companyInfo}
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;