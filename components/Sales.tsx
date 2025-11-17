import React, { useState, useMemo } from 'react';
import { StoreProgress, IndividualProgress } from '../types';
import { useAppContext } from '../context/AppContext';
import { PlusIcon, TrashIcon, EditIcon, QrCodeIcon } from './icons';
import Modal from './Modal';
import FormattedInput from './FormInputs';
import QrCodeModal from './QrCodeModal';

const initialProgressState: Omit<StoreProgress, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    pesos: 0, tickets: 0, unidades: 0, calzado: 0, indumentaria: 0, camiseta: 0,
    accesorios: 0, medias: 0, pesosMcCred: 0, unidadesMcCred: 0,
};

interface StoreProgressFormProps {
    onSubmit: (data: Omit<StoreProgress, 'id'>) => void;
    onClose: () => void;
    progressToEdit?: StoreProgress | null;
}

const StoreProgressForm: React.FC<StoreProgressFormProps> = ({ onSubmit, onClose, progressToEdit }) => {
    const [progress, setProgress] = useState(progressToEdit || initialProgressState);
    
    const handleChange = (field: keyof typeof progress, value: string | number) => {
        setProgress(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(progress);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormattedInput label="Fecha" type="date" value={progress.date} onChange={v => handleChange('date', v)} name="date" />
                <FormattedInput label="Pesos ($)" isCurrency value={progress.pesos} onChange={v => handleChange('pesos', v)} name="pesos" />
                <FormattedInput label="Tickets" type="number" value={progress.tickets} onChange={v => handleChange('tickets', v)} name="tickets" />
                <FormattedInput label="Unidades" type="number" value={progress.unidades} onChange={v => handleChange('unidades', v)} name="unidades" />
                <FormattedInput label="Calzado (U)" type="number" value={progress.calzado} onChange={v => handleChange('calzado', v)} name="calzado" />
                <FormattedInput label="Indumentaria (U)" type="number" value={progress.indumentaria} onChange={v => handleChange('indumentaria', v)} name="indumentaria" />
                <FormattedInput label="Camisetas (U)" type="number" value={progress.camiseta} onChange={v => handleChange('camiseta', v)} name="camiseta" />
                <FormattedInput label="Accesorios (U)" type="number" value={progress.accesorios} onChange={v => handleChange('accesorios', v)} name="accesorios" />
                <FormattedInput label="Medias (U)" type="number" value={progress.medias} onChange={v => handleChange('medias', v)} name="medias" />
                <FormattedInput label="Pesos MC Cred. ($)" isCurrency value={progress.pesosMcCred} onChange={v => handleChange('pesosMcCred', v)} name="pesosMcCred" />
                <FormattedInput label="Unidades MC Cred." type="number" value={progress.unidadesMcCred} onChange={v => handleChange('unidadesMcCred', v)} name="unidadesMcCred" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    {progressToEdit ? 'Actualizar Avance' : 'Guardar Avance'}
                </button>
            </div>
        </form>
    );
};

const initialIndividualStateVendedor: Omit<IndividualProgress, 'id' | 'userId'> = {
    date: new Date().toISOString().split('T')[0],
    pesos: 0, unidades: 0, tickets: 0, calzado: 0, indumentaria: 0, camiseta: 0, accesorios: 0,
    pesosMcCred: 0, unidadesMcCred: 0,
};
const initialIndividualStateCajero: Omit<IndividualProgress, 'id' | 'userId'> = {
    date: new Date().toISOString().split('T')[0],
    pesosMcCred: 0, unidadesMcCred: 0, medias: 0,
};

interface IndividualProgressFormProps {
    onSubmit: (data: Omit<IndividualProgress, 'id' | 'userId'>) => void;
    onClose: () => void;
    progressToEdit?: IndividualProgress | null;
}

const IndividualProgressForm: React.FC<IndividualProgressFormProps> = ({ onSubmit, onClose, progressToEdit }) => {
    const { currentUser } = useAppContext();
    if (!currentUser) return null;

    const isVendedor = currentUser.role === 'Vendedor';
    const getInitialState = () => {
        if (progressToEdit) return progressToEdit;
        return isVendedor ? initialIndividualStateVendedor : initialIndividualStateCajero;
    }
    const [progress, setProgress] = useState(getInitialState());

    const handleChange = (field: keyof typeof progress, value: string | number) => {
        setProgress(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(progress);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormattedInput label="Fecha" type="date" value={progress.date} onChange={v => handleChange('date', v)} name="date" />
            {isVendedor && (
                <>
                    <FormattedInput label="Pesos ($)" isCurrency value={progress.pesos || 0} onChange={v => handleChange('pesos', v)} name="pesos" />
                    <FormattedInput label="Unidades" type="number" value={progress.unidades || 0} onChange={v => handleChange('unidades', v)} name="unidades" />
                    <FormattedInput label="Tickets" type="number" value={progress.tickets || 0} onChange={v => handleChange('tickets', v)} name="tickets" />
                    <FormattedInput label="Calzado (U)" type="number" value={progress.calzado || 0} onChange={v => handleChange('calzado', v)} name="calzado" />
                    <FormattedInput label="Indumentaria (U)" type="number" value={progress.indumentaria || 0} onChange={v => handleChange('indumentaria', v)} name="indumentaria" />
                    <FormattedInput label="Camisetas (U)" type="number" value={progress.camiseta || 0} onChange={v => handleChange('camiseta', v)} name="camiseta" />
                    <FormattedInput label="Accesorios (U)" type="number" value={progress.accesorios || 0} onChange={v => handleChange('accesorios', v)} name="accesorios" />
                </>
            )}
            {!isVendedor && ( // Cajero
                <FormattedInput label="Medias (U)" type="number" value={progress.medias || 0} onChange={v => handleChange('medias', v)} name="medias" />
            )}
            
            <FormattedInput label="Pesos MC Cred. ($)" isCurrency value={progress.pesosMcCred || 0} onChange={v => handleChange('pesosMcCred', v)} name="pesosMcCred" />
            <FormattedInput label="Unidades MC Cred." type="number" value={progress.unidadesMcCred || 0} onChange={v => handleChange('unidadesMcCred', v)} name="unidadesMcCred" />

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    {progressToEdit ? 'Actualizar Carga' : 'Guardar Carga'}
                </button>
            </div>
        </form>
    );
};

const Sales: React.FC = () => {
    const {
        currentUser, storeProgress, addStoreProgress, updateStoreProgress, deleteStoreProgress,
        individualProgress, addIndividualProgress, updateIndividualProgress, deleteIndividualProgress
    } = useAppContext();
    
    if (!currentUser) return null;

    const isManager = currentUser.role === 'Encargado';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [progressToEdit, setProgressToEdit] = useState<StoreProgress | IndividualProgress | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [qrData, setQrData] = useState('');

    const userIndividualProgress = useMemo(
        () => individualProgress.filter(p => p.userId === currentUser.id),
        [individualProgress, currentUser.id]
    );

    const handleOpenModal = (progress?: StoreProgress | IndividualProgress) => {
        setProgressToEdit(progress || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setProgressToEdit(null);
    };

    const handleFormSubmit = (data: Omit<StoreProgress, 'id'> | Omit<IndividualProgress, 'id' | 'userId'>) => {
        if (progressToEdit) {
            isManager 
                ? updateStoreProgress(progressToEdit.id, data as Partial<Omit<StoreProgress, 'id'>>) 
                : updateIndividualProgress(progressToEdit.id, data as Partial<Omit<IndividualProgress, 'id'|'userId'>>);
        } else {
            isManager 
                ? addStoreProgress(data as Omit<StoreProgress, 'id'>) 
                : addIndividualProgress(data as Omit<IndividualProgress, 'id'|'userId'>);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
            isManager ? deleteStoreProgress(id) : deleteIndividualProgress(id);
        }
    };
    
    const openQrForSale = (sale: IndividualProgress) => {
        const saleString = `Fecha: ${sale.date}\nPesos: $${sale.pesos}\nUnidades: ${sale.unidades}`;
        setQrData(saleString);
        setIsQrModalOpen(true);
    };

    const dataToShow = isManager ? storeProgress : userIndividualProgress;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                    {isManager ? 'Avance Diario del Local' : 'Mis Cargas Diarias'}
                </h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                    <PlusIcon />
                    <span>{isManager ? 'Cargar Avance' : 'Nueva Carga'}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-red-900">
                        <thead className="bg-gray-50 dark:bg-black">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pesos ($)</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Unidades</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">MC Cred ($)</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-red-900">
                            {dataToShow.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(item => (
                                <tr key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{new Date(item.date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{('pesos' in item ? item.pesos : 'N/A')?.toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{('unidades' in item ? item.unidades : 'N/A')?.toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{item.pesosMcCred?.toLocaleString('es-AR')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-4">
                                            {!isManager && ('pesos' in item) && <button onClick={() => openQrForSale(item)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><QrCodeIcon/></button>}
                                            <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"><EditIcon />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={progressToEdit ? 'Editar Registro' : 'Nuevo Registro'}>
                {isManager
                    ? <StoreProgressForm onSubmit={handleFormSubmit as any} onClose={handleCloseModal} progressToEdit={progressToEdit as StoreProgress | null} />
                    : <IndividualProgressForm onSubmit={handleFormSubmit as any} onClose={handleCloseModal} progressToEdit={progressToEdit as IndividualProgress | null} />
                }
            </Modal>
             <QrCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} data={qrData} />
        </div>
    );
};

export default Sales;