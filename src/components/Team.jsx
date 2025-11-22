import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PlusIcon, TrashIcon, EditIcon } from './icons';
import Modal from './Modal';
import FormattedInput from './FormInputs';

const USER_ROLES = ['Encargado', 'Vendedor', 'Cajero'];
const TEAM_SUB_GOALS = [
    { key: 'metaCalzado', label: 'Calzado' },
    { key: 'metaIndumentaria', label: 'Indumentaria' },
    { key: 'metaAccesorios', label: 'Accesorios' },
    { key: 'metaCamiseta', label: 'Camisetas' },
    { key: 'metaMedias', label: 'Medias' },
];


const TeamForm = ({ onSubmit, onClose, userToEdit }) => {
    const [name, setName] = useState(userToEdit?.name || '');
    const [role, setRole] = useState(userToEdit?.role || 'Vendedor');
    const [avatarUrl, setAvatarUrl] = useState(userToEdit?.avatarUrl || `https://i.pravatar.cc/150?u=${name || 'new'}`);

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!name.trim()) return;
        onSubmit({ name, role, avatarUrl });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm" />
            </div>
             <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rol</label>
                <select id="role" value={role} onChange={e => setRole(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-md">
                    {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    {userToEdit ? 'Actualizar Miembro' : 'Añadir Miembro'}
                </button>
            </div>
        </form>
    );
};

const GoalInput = ({ label, value, onChange, placeholder = "0" }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <input 
            type="number" 
            placeholder={placeholder}
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md" 
        />
    </div>
);


const Team = ({ viewMode }) => {
  const { users, goals, addUser, updateUser, deleteUser, handleSetGoals, messages, addMessage, deleteMessage } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newMessage, setNewMessage] = useState('');
  
  const [currentTeamGoal, setCurrentTeamGoal] = useState({});
  const [monthlyHours, setMonthlyHours] = useState({});
  const [showNewMonthBanner, setShowNewMonthBanner] = useState(false);

  useEffect(() => {
    const goalForMonth = goals.find(g => g.month === currentMonth);
    setCurrentTeamGoal(goalForMonth?.teamGoal || {});

    // Logic for new month banner
    const isActualCurrentMonth = currentMonth === new Date().toISOString().slice(0, 7);
    if (isActualCurrentMonth) {
        const goalsForCurrentMonthExist = goals.some(g => g.month === currentMonth);
        setShowNewMonthBanner(!goalsForCurrentMonthExist);
    } else {
        setShowNewMonthBanner(false);
    }

  }, [currentMonth, goals]);

  useEffect(() => {
    const hoursForMonth = users.reduce((acc, user) => {
        acc[user.id] = (user.assignedHours?.[currentMonth] || '').toString();
        return acc;
    }, {});
    setMonthlyHours(hoursForMonth);
  }, [currentMonth, users]);


  const handleOpenModal = (user) => {
    setUserToEdit(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
  };

  const handleFormSubmit = (userData) => {
    if (userToEdit) {
      updateUser(userToEdit.id, userData);
    } else {
      addUser(userData);
    }
    handleCloseModal();
  };
  
  const handleTeamGoalChange = (goalKey, value) => {
      const numericValue = Number(value) || 0;
      setCurrentTeamGoal(prev => ({ ...prev, [goalKey]: numericValue }));
  };
  
  const handleSaveGoals = () => {
    const vendedores = users.filter(u => u.role === 'Vendedor');
    const cajeros = users.filter(u => u.role === 'Cajero');
    const totalVendedorHours = vendedores.reduce((sum, u) => sum + Number(monthlyHours[u.id] || 0), 0);

    const newUserGoals = {};

    vendedores.forEach(vendedor => {
        const participation = totalVendedorHours > 0 ? (Number(monthlyHours[vendedor.id] || 0)) / totalVendedorHours : 0;
        newUserGoals[vendedor.id] = {
            metaPesos: Math.round((currentTeamGoal.metaPesos || 0) * participation),
            metaTickets: Math.round((currentTeamGoal.metaTickets || 0) * participation), 
            metaUnidades: Math.round((currentTeamGoal.metaUnidades || 0) * participation),
            metaPesosMcCred: Math.round((currentTeamGoal.metaPesosMcCred || 0) * participation),
            metaUnidadesMcCred: Math.round((currentTeamGoal.metaUnidadesMcCred || 0) * participation),
            metaCalzado: Math.round((currentTeamGoal.metaCalzado || 0) * participation),
            metaIndumentaria: Math.round((currentTeamGoal.metaIndumentaria || 0) * participation),
            metaCamiseta: Math.round((currentTeamGoal.metaCamiseta || 0) * participation),
            metaAccesorios: Math.round((currentTeamGoal.metaAccesorios || 0) * participation),
        };
    });
    
    cajeros.forEach(cajero => {
        const participation = cajeros.length > 0 ? 1 / cajeros.length : 0;
        newUserGoals[cajero.id] = {
            metaPesosMcCred: Math.round((currentTeamGoal.metaPesosMcCred || 0) * participation),
            metaUnidadesMcCred: Math.round((currentTeamGoal.metaUnidadesMcCred || 0) * participation),
            metaMedias: Math.round((currentTeamGoal.metaMedias || 0) * participation),
        };
    });
    
    const assignedHoursSnapshot = {};
    users.forEach(user => {
      assignedHoursSnapshot[user.id] = Number(monthlyHours[user.id] || 0);
    });

    const newGoalForMonth = {
        month: currentMonth,
        teamGoal: currentTeamGoal,
        userGoals: newUserGoals,
        assignedHoursSnapshot,
    };
    
    handleSetGoals(newGoalForMonth);
    alert('Metas y horas asignadas guardadas y distribuidas exitosamente.');
  };
  
  const getCalculatedUserGoals = (userId) => {
     const user = users.find(u => u.id === userId);
     if (!user) return {};

     if (user.role === 'Vendedor') {
        const vendedores = users.filter(u => u.role === 'Vendedor');
        const totalVendedorHours = vendedores.reduce((sum, u) => sum + Number(monthlyHours[u.id] || 0), 0);
        const participation = totalVendedorHours > 0 ? (Number(monthlyHours[user.id] || 0)) / totalVendedorHours : 0;
        return {
            metaPesos: Math.round((currentTeamGoal.metaPesos || 0) * participation),
            metaTickets: Math.round((currentTeamGoal.metaTickets || 0) * participation),
            metaUnidades: Math.round((currentTeamGoal.metaUnidades || 0) * participation),
            metaPesosMcCred: Math.round((currentTeamGoal.metaPesosMcCred || 0) * participation),
            metaUnidadesMcCred: Math.round((currentTeamGoal.metaUnidadesMcCred || 0) * participation),
            metaCalzado: Math.round((currentTeamGoal.metaCalzado || 0) * participation),
            metaIndumentaria: Math.round((currentTeamGoal.metaIndumentaria || 0) * participation),
            metaCamiseta: Math.round((currentTeamGoal.metaCamiseta || 0) * participation),
            metaAccesorios: Math.round((currentTeamGoal.metaAccesorios || 0) * participation),
        };
     }
     
     if (user.role === 'Cajero') {
        const cajeros = users.filter(u => u.role === 'Cajero');
        const participation = cajeros.length > 0 ? 1 / cajeros.length : 0;
        return {
            metaPesosMcCred: Math.round((currentTeamGoal.metaPesosMcCred || 0) * participation),
            metaUnidadesMcCred: Math.round((currentTeamGoal.metaUnidadesMcCred || 0) * participation),
            metaMedias: Math.round((currentTeamGoal.metaMedias || 0) * participation),
        };
     }

     return {};
  };

  const handleHourChange = (userId, hours) => {
    setMonthlyHours(prev => ({ ...prev, [userId]: hours }));
  };

  const handleSaveHours = () => {
    Object.entries(monthlyHours).forEach(([userId, hoursStr]) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            const newHours = Number(hoursStr) || 0;
            const updatedAssignedHours = {
                ...(user.assignedHours || {}),
                [currentMonth]: newHours,
            };
            updateUser(userId, { assignedHours: updatedAssignedHours });
        }
    });
    alert('Horas guardadas exitosamente.');
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      addMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          {viewMode === 'members' ? 'Miembros del Equipo' : 'Metas Mensuales'}
        </h2>
        {viewMode === 'members' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              <PlusIcon />
              <span>Añadir Miembro</span>
            </button>
        )}
      </div>

      {viewMode === 'members' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-red-900">
                <thead className="bg-gray-50 dark:bg-black">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Rol</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-red-900">
                    {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center">
                            <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full mr-3" />
                            {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-4">
                            <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"><EditIcon /></button>
                            <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon /></button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
          
           <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Comunicados al Equipo</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje importante para tu equipo..."
                  className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-red-500 dark:focus:border-red-500"
                  rows={3}
                />
                <button
                  onClick={handleAddMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-slate-500"
                >
                  Publicar
                </button>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Historial de Mensajes</h4>
                 {messages.length > 0 ? (
                    <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {messages.map(msg => (
                            <li key={msg.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(msg.date).toLocaleString('es-AR')}</p>
                                </div>
                                <button onClick={() => deleteMessage(msg.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 ml-4 flex-shrink-0"><TrashIcon /></button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 mt-4">No hay mensajes enviados.</p>
                )}
              </div>
            </div>
        </div>
      )}

      {viewMode === 'goals' && (
          <div className="space-y-8">
             {showNewMonthBanner && (
                <div className="p-4 text-center bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="font-semibold text-blue-800 dark:text-blue-200">
                        ¡Bienvenido al nuevo mes! Es hora de establecer las metas de{' '}
                        {new Date(currentMonth + '-02').toLocaleString('es-AR', { month: 'long' })}.
                    </p>
                </div>
            )}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Metas Totales del Equipo</h3>
                  <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FormattedInput label="Meta Pesos ($)" name="metaPesos" isCurrency value={currentTeamGoal.metaPesos || 0} onChange={(v) => handleTeamGoalChange('metaPesos', v)} />
                  <GoalInput label="Meta Cantidad de Tickets" value={currentTeamGoal.metaTickets} onChange={(v) => handleTeamGoalChange('metaTickets', v)} />
                  <GoalInput label="Meta Unidades" value={currentTeamGoal.metaUnidades} onChange={(v) => handleTeamGoalChange('metaUnidades', v)} />
                  <FormattedInput label="Meta Pesos MC Cred. ($)" name="metaPesosMcCred" isCurrency value={currentTeamGoal.metaPesosMcCred || 0} onChange={(v) => handleTeamGoalChange('metaPesosMcCred', v)} />
                  <GoalInput label="Meta Unidades MC Cred." value={currentTeamGoal.metaUnidadesMcCred} onChange={(v) => handleTeamGoalChange('metaUnidadesMcCred', v)} />
              </div>
              <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Sub-Metas de Unidades por Categoría</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {TEAM_SUB_GOALS.map(g => (
                      <GoalInput key={g.key} label={g.label} value={currentTeamGoal?.[g.key]} onChange={(v) => handleTeamGoalChange(g.key, v)} />
                  ))}
              </div>
               <div className="flex justify-end mt-6">
                    <button onClick={handleSaveGoals} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                        Guardar y Distribuir Metas
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 capitalize">
                    Horas Asignadas para {new Date(currentMonth + '-02').toLocaleString('es-AR', { month: 'long' })}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Define las horas de trabajo para cada colaborador este mes. Esto afectará la distribución de metas y el cálculo de comisiones.
                </p>
                <div className="space-y-3">
                    {users.filter(u => u.role !== 'Encargado').map(user => (
                        <div key={user.id} className="flex items-center justify-between gap-4 p-2 rounded-md bg-gray-50 dark:bg-gray-800/50">
                            <label htmlFor={`hours-${user.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {user.name} <span className="text-xs text-slate-500">({user.role})</span>
                            </label>
                            <input
                                type="number"
                                id={`hours-${user.id}`}
                                value={monthlyHours[user.id] || ''}
                                onChange={(e) => handleHourChange(user.id, e.target.value)}
                                placeholder="0"
                                className="w-24 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-right"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={handleSaveHours} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">
                        Guardar Horas
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Metas Asignadas por Colaborador (Solo Lectura)</h3>
                <div className="space-y-4">
                     {users.filter(u => u.role !== 'Encargado').map(user => {
                         const userGoals = getCalculatedUserGoals(user.id);
                         return (
                            <div key={user.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                                <p className="font-bold text-md text-slate-800 dark:text-slate-100">{user.name} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({user.role})</span></p>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                    {Object.entries(userGoals).map(([key, value]) => (
                                        <div key={key}>
                                            <span className="text-slate-600 dark:text-slate-300">{key.replace('meta', '')}: </span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{value?.toLocaleString('es-AR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )
                     })}
                </div>
            </div>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={userToEdit ? 'Editar Miembro' : 'Añadir Miembro'}
      >
        <TeamForm onSubmit={handleFormSubmit} onClose={handleCloseModal} userToEdit={userToEdit} />
      </Modal>
    </div>
  );
};

export default Team;
