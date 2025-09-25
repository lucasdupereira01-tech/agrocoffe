import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

const AppContext = createContext();

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initializing Firebase
let db, auth, app;
if (Object.keys(firebaseConfig).length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

const safeAppId = appId.replace(/[^a-zA-Z0-9]/g, '_');

const dbPaths = {
    talhoes: (userId) => `artifacts/${safeAppId}/users/${userId}/talhoes`,
    atividades: (userId) => `artifacts/${safeAppId}/users/${userId}/atividades`,
    receitas: (userId) => `artifacts/${safeAppId}/users/${userId}/receitas`,
    compras: (userId) => `artifacts/${safeAppId}/users/${userId}/compras`,
    funcionarios: (userId) => `artifacts/${safeAppId}/users/${userId}/funcionarios`,
    colheitas: (userId) => `artifacts/${safeAppId}/users/${userId}/colheitas`,
};

// Componente de Dropdown reutilizável
const Dropdown = ({ trigger, children, position = 'bottom-left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    let positionClasses = '';
    switch (position) {
      case 'bottom-left':
        positionClasses = 'origin-top-left left-0 mt-2';
        break;
      case 'bottom-right':
        positionClasses = 'origin-top-right right-0 mt-2';
        break;
      case 'top-left':
        positionClasses = 'origin-bottom-left left-0 mb-2 bottom-full';
        break;
      case 'top-right':
        positionClasses = 'origin-bottom-right right-0 mb-2 bottom-full';
        break;
      default:
        positionClasses = 'origin-top-left left-0 mt-2';
    }

    return (
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <div>
          <button
            type="button"
            className="text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-800"
            id="options-menu"
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={toggleDropdown}
          >
            {trigger || 'Opções'}
            <svg
              className="-mr-1 ml-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div
            className={`absolute z-10 ${positionClasses} w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-up`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            <div className="py-1" role="none">
              {children}
            </div>
          </div>
        )}
      </div>
    );
};

const Header = ({ setCurrentPage }) => (
    <header className="bg-emerald-600 dark:bg-emerald-800 text-white shadow-md rounded-b-xl">
        <div className="container mx-auto p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2a2 2 0 0 1 2 2v6h-4V4a2 2 0 0 1 2-2zM4 10a2 2 0 0 0 2 2h4v-4H6a2 2 0 0 0-2 2zM14 10a2 2 0 0 1 2 2h-4v-4h4zM10 16a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4h-4v4zm0-6v4h4v-4h-4zM8 18v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2h-4v2zm-2-8v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-4h4z"/>
                </svg>
                <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Café</h1>
            </div>
            <nav className="flex space-x-2 md:space-x-4">
                <button onClick={() => setCurrentPage('dashboard')} className="text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">Início</button>
                <button onClick={() => setCurrentPage('talhoes')} className="text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">Talhões</button>
                <button onClick={() => setCurrentPage('receitas')} className="text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">Receitas</button>
                <button onClick={() => setCurrentPage('atividades')} className="text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">Atividades</button>
                <button onClick={() => setCurrentPage('compras')} className="text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">Compras</button>
                {/* Dropdown para Colheita */}
                <Dropdown trigger={<span className="text-white">Colheita</span>}>
                    <a
                        href="#"
                        onClick={() => setCurrentPage('colheita')}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                    >
                        Registros
                    </a>
                    <a
                        href="#"
                        onClick={() => setCurrentPage('producao')}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                    >
                        Listar Produção
                    </a>
                </Dropdown>
            </nav>
        </div>
    </header>
);

const Footer = ({ userId }) => (
    <footer className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-4 text-center text-sm mt-8 rounded-t-xl shadow-inner">
        <p>User ID: {userId}</p>
        <p>© 2024 Gerenciamento de Fazenda de Café. Todos os direitos reservados.</p>
    </footer>
);

// Componente Modal reutilizável
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 rounded-2xl shadow-xl w-full max-w-lg relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            {children}
        </div>
    </div>
);

const DashboardCard = ({ title, value, icon }) => (
    <div className="bg-emerald-500 dark:bg-emerald-700 p-6 rounded-2xl shadow-xl flex items-center justify-between text-white">
        <div className="flex-1">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="w-12 h-12 flex items-center justify-center bg-white bg-opacity-20 rounded-full">
            {icon}
        </div>
    </div>
);

// Ícones SVG para o Dashboard
const AreaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
);

const PlantsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.9 20A9.3 9.3 0 0 1 4 16.1c2.7-.9 4.3-2.5 6-4.2 1.7 1.7 3.3 3.3 6 4.2a9.3 9.3 0 0 1-3.9 3.9"/>
        <path d="M12 18V9"/>
        <path d="M20 10a8 8 0 0 0-16 0"/>
        <path d="M18 10c0-1.7-1.5-3-3.5-3"/>
        <path d="M6 10c0-1.7 1.5-3 3.5-3"/>
        <path d="M12 18c-3.3 0-6-2.5-6-5"/>
    </svg>
);

const TalhaoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M15 3v18"/>
        <path d="M9 3v18"/>
        <path d="M3 9h18"/>
        <path d="M3 15h18"/>
    </svg>
);

const DashboardPage = () => {
    const { talhoes, atividades } = useContext(AppContext);
    // Calcular estatísticas
    const totalArea = talhoes.reduce((sum, talhao) => sum + (talhao.Area || 0), 0);
    const totalPlants = talhoes.reduce((sum, talhao) => sum + (talhao.N_Plantas || 0), 0);

    const servicosCount = atividades.reduce((acc, atividade) => {
        const servico = atividade.servico;
        if (servico) {
            acc[servico] = (acc[servico] || 0) + 1;
        }
        return acc;
    }, {});

    // Adicionado filtro para garantir que a atividade tenha um carimbo de data/hora antes de ordenar
    const latestActivities = atividades
        .filter(a => a.data)
        .sort((a, b) => b.data.toMillis() - a.data.toMillis())
        .slice(0, 5);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard
                    title="Área Total da Fazenda"
                    value={`${totalArea.toFixed(2)} ha`}
                    icon={<AreaIcon />}
                />
                <DashboardCard
                    title="Total de Plantas"
                    value={totalPlants.toLocaleString('pt-BR')}
                    icon={<PlantsIcon />}
                />
                <DashboardCard
                    title="Total de Talhões"
                    value={talhoes.length}
                    icon={<TalhaoIcon />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">Atividades por Serviço</h3>
                    <ul className="space-y-2">
                        {Object.entries(servicosCount).map(([servico, count]) => (
                            <li key={servico} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span className="text-lg font-medium">{servico}</span>
                                <span className="px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full">{count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">Últimas Atividades</h3>
                    <ul className="space-y-2">
                        {latestActivities.length > 0 ? (
                            latestActivities.map(atividade => (
                                <li key={atividade.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-base">{atividade.servico} em {atividade.talhao}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{atividade.data?.toDate().toLocaleDateString('pt-BR') || 'Data inválida'}</span>
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        {atividade.data?.toDate().toLocaleDateString('pt-BR') || 'Data inválida'}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Nenhuma atividade recente.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const TalhoesPage = () => {
    const { talhoes, userId } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTalhao, setSelectedTalhao] = useState(null);
    const [formState, setFormState] = useState({});
    const [statusMessage, setStatusMessage] = useState('');

    const handleOpenModal = (talhao = null) => {
        setSelectedTalhao(talhao);
        setFormState(talhao || { Nome: '', Cultivar: '', Espacamento: '', Area: '', N_Plantas: '', Plantio: '', Altitude: '' });
        setIsModalOpen(true);
        setStatusMessage('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTalhao(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }

        const talhoesRef = collection(db, dbPaths.talhoes(userId));
        const talhaoData = {
            Nome: formState.Nome,
            Cultivar: formState.Cultivar,
            Espacamento: formState.Espacamento,
            Area: parseFloat(formState.Area) || 0,
            N_Plantas: parseInt(formState.N_Plantas, 10) || 0,
            Plantio: parseInt(formState.Plantio, 10) || 0,
            Altitude: parseInt(formState.Altitude, 10) || 0,
        };

        try {
            if (selectedTalhao) {
                const docRef = doc(db, dbPaths.talhoes(userId), selectedTalhao.id);
                await updateDoc(docRef, talhaoData);
                setStatusMessage("Talhão atualizado com sucesso!");
            } else {
                await addDoc(talhoesRef, talhaoData);
                setStatusMessage("Talhão adicionado com sucesso!");
            }
            setTimeout(handleCloseModal, 1500);
        } catch (error) {
            console.error("Erro ao salvar talhão:", error);
            setStatusMessage(`Erro ao salvar talhão: ${error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }
        if (window.confirm("Tem certeza que deseja deletar este talhão?")) {
            try {
                const docRef = doc(db, dbPaths.talhoes(userId), id);
                await deleteDoc(docRef);
                setStatusMessage("Talhão deletado com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar talhão:", error);
                setStatusMessage(`Erro ao deletar talhão: ${error.message}`);
            }
        }
    };

    return (
        <div className="container mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">Gerenciamento de Talhões</h2>
                <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span>Adicionar Talhão</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cultivar</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Espaçamento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Área (ha)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº Plantas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plantio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Altitude (m)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {talhoes.map(talhao => (
                            <tr key={talhao.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{talhao.Nome}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{talhao.Cultivar}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{talhao.Espacamento}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{talhao.Area}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{talhao.N_Plantas}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{talhao.Plantio}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{talhao.Altitude}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleOpenModal(talhao)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors mr-4">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(talhao.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                        Deletar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <h3 className="text-2xl font-bold mb-4">{selectedTalhao ? 'Editar Talhão' : 'Adicionar Novo Talhão'}</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <input name="Nome" value={formState.Nome} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Nome do Talhão (ex: C-01)" required />
                        <input name="Cultivar" value={formState.Cultivar} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Cultivar" />
                        <input name="Espacamento" value={formState.Espacamento} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Espaçamento (ex: 3,5 x 0,5)" />
                        <input name="Area" type="number" step="0.1" value={formState.Area} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Área (ha)" />
                        <input name="N_Plantas" type="number" value={formState.N_Plantas} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Número de Plantas" />
                        <input name="Plantio" type="number" value={formState.Plantio} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Ano de Plantio" />
                        <input name="Altitude" type="number" value={formState.Altitude} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Altitude (m)" />
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCloseModal} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                    {statusMessage && <p className="mt-4 text-center text-sm">{statusMessage}</p>}
                </Modal>
            )}
        </div>
    );
};

const ReceitasPage = () => {
    const { receitas, userId } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReceita, setSelectedReceita] = useState(null);
    const [formState, setFormState] = useState({
        Nome: '', Tipo: '', Produtos: [{ Nome: '', Dose: '', Unidade: '' }]
    });
    const [statusMessage, setStatusMessage] = useState('');

    // Obtenha a lista de tipos de serviço únicos para o select
    const availableServices = Array.from(new Set(receitas.map(r => r.Tipo)));

    const handleOpenModal = (receita = null) => {
        setSelectedReceita(receita);
        setFormState(receita || { Nome: '', Tipo: '', Produtos: [{ Nome: '', Dose: '', Unidade: '' }] });
        setIsModalOpen(true);
        setStatusMessage('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedReceita(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleProductChange = (index, e) => {
        const { name, value } = e.target;
        const newProdutos = [...formState.Produtos];
        newProdutos[index][name] = value;
        setFormState(prev => ({ ...prev, Produtos: newProdutos }));
    };

    const handleAddProduct = () => {
        setFormState(prev => ({ ...prev, Produtos: [...prev.Produtos, { Nome: '', Dose: '', Unidade: '' }] }));
    };

    const handleRemoveProduct = (index) => {
        const newProdutos = [...formState.Produtos];
        newProdutos.splice(index, 1);
        setFormState(prev => ({ ...prev, Produtos: newProdutos }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }

        const receitasRef = collection(db, dbPaths.receitas(userId));
        const receitaData = {
            Nome: formState.Nome,
            Tipo: formState.Tipo,
            Produtos: formState.Produtos.filter(p => p.Nome !== ''),
        };

        try {
            if (selectedReceita) {
                const docRef = doc(db, dbPaths.receitas(userId), selectedReceita.id);
                await updateDoc(docRef, receitaData);
                setStatusMessage("Receita atualizada com sucesso!");
            } else {
                await addDoc(receitasRef, receitaData);
                setStatusMessage("Receita adicionada com sucesso!");
            }
            setTimeout(handleCloseModal, 1500);
        } catch (error) {
            console.error("Erro ao salvar receita:", error);
            setStatusMessage(`Erro ao salvar receita: ${error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }
        if (window.confirm("Tem certeza que deseja deletar esta receita?")) {
            try {
                const docRef = doc(db, dbPaths.receitas(userId), id);
                await deleteDoc(docRef);
                setStatusMessage("Receita deletada com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar receita:", error);
                setStatusMessage(`Erro ao deletar receita: ${error.message}`);
            }
        }
    };

    return (
        <div className="container mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">Gerenciamento de Receitas</h2>
                <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span>Adicionar Receita</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome da Receita</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo de Serviço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produtos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {receitas.map(receita => (
                            <tr key={receita.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{receita.Nome}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{receita.Tipo}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {receita.Produtos && receita.Produtos.map((produto, index) => (
                                        <div key={index}>
                                            <p className="font-semibold">{produto.Nome}</p>
                                            <p className="text-xs">{produto.Dose} {produto.Unidade}</p>
                                        </div>
                                    ))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleOpenModal(receita)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors mr-4">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(receita.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                        Deletar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <h3 className="text-2xl font-bold mb-4">{selectedReceita ? 'Editar Receita' : 'Adicionar Nova Receita'}</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <input name="Nome" value={formState.Nome} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Nome da Receita (ex: Adubação de Inverno)" required />
                        
                        {/* Campo de seleção do tipo de serviço */}
                        <select
                            name="Tipo"
                            value={formState.Tipo}
                            onChange={handleFormChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                            required
                        >
                            <option value="">Selecione um Tipo de Serviço</option>
                            {availableServices.map(servico => (
                                <option key={servico} value={servico}>{servico}</option>
                            ))}
                        </select>
                        
                        <div className="space-y-2 mt-4">
                            <h4 className="font-semibold text-lg">Produtos</h4>
                            {formState.Produtos.map((produto, index) => (
                                <div key={index} className="flex space-x-2 items-center">
                                    <input
                                        name="Nome"
                                        value={produto.Nome}
                                        onChange={(e) => handleProductChange(index, e)}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                        placeholder="Nome do Produto"
                                        required
                                    />
                                    <input
                                        name="Dose"
                                        value={produto.Dose}
                                        onChange={(e) => handleProductChange(index, e)}
                                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                        placeholder="Dose"
                                        required
                                    />
                                    <input
                                        name="Unidade"
                                        value={produto.Unidade}
                                        onChange={(e) => handleProductChange(index, e)}
                                        className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                        placeholder="Unidade"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveProduct(index)}
                                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-1.41-1.41L12 10.17l-5.59-5.58L5 7l7 7 7-7zM5 19l1.41 1.41L12 13.83l5.59 5.58L19 19l-7-7-7 7z" /></svg>
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                                Adicionar Produto
                            </button>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCloseModal} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                    {statusMessage && <p className="mt-4 text-center text-sm">{statusMessage}</p>}
                </Modal>
            )}
        </div>
    );
};

const AtividadesPage = ({ isPdfLoaded }) => {
    const { atividades, talhoes, receitas, userId } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAtividade, setSelectedAtividade] = useState(null);
    const [formState, setFormState] = useState({
        talhao: '', data: '', servico: '', produtos: [], observacao: '', receitaNome: ''
    });
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [newService, setNewService] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // Estados para os filtros e exportação
    const [selectedTalhaoFilter, setSelectedTalhaoFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    useEffect(() => {
        // Define o intervalo de data padrão para 1 de julho do ano anterior até 30 de junho do ano atual
        const defaultStartDate = new Date(currentYear - 1, 6, 1).toISOString().slice(0, 10);
        const defaultEndDate = new Date(currentYear, 5, 30).toISOString().slice(0, 10);
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
    }, []);

    const handleOpenModal = (atividade = null) => {
        setSelectedAtividade(atividade);
        const activityDate = atividade?.data ? atividade.data.toDate().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        setFormState(atividade ? {
            ...atividade,
            data: activityDate,
            receitaNome: receitas.find(r => r.Tipo === atividade.servico && r.Produtos.every(p => atividade.produtos.some(ap => ap.Nome === p.Nome)))?.Nome || ''
        } : { talhao: talhoes[0]?.Nome || '', data: activityDate, servico: '', produtos: [], observacao: '', receitaNome: '' });
        setIsModalOpen(true);
        setStatusMessage('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAtividade(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceTypeChange = (e) => {
        const { value } = e.target;
        setFormState(prev => ({ ...prev, servico: value, receitaNome: '', produtos: [] }));
    };

    const handleRecipeChange = (e) => {
        const { value } = e.target;
        const selectedReceita = receitas.find(r => r.Nome === value);
        if (selectedReceita) {
            setFormState(prev => ({ ...prev, servico: selectedReceita.Tipo, produtos: selectedReceita.Produtos, receitaNome: selectedReceita.Nome }));
        } else {
            setFormState(prev => ({ ...prev, produtos: [], receitaNome: value }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }

        const atividadesRef = collection(db, dbPaths.atividades(userId));
        const atividadeData = {
            talhao: formState.talhao,
            data: new Date(formState.data),
            servico: formState.servico,
            produtos: formState.produtos,
            observacao: formState.observacao,
            timestamp: serverTimestamp(),
        };

        try {
            if (selectedAtividade) {
                const docRef = doc(db, dbPaths.atividades(userId), selectedAtividade.id);
                await updateDoc(docRef, atividadeData);
                setStatusMessage("Atividade atualizada com sucesso!");
            } else {
                await addDoc(atividadesRef, atividadeData);
                setStatusMessage("Atividade adicionada com sucesso!");
            }
            setTimeout(handleCloseModal, 1500);
        } catch (error) {
            console.error("Erro ao salvar atividade:", error);
            setStatusMessage(`Erro ao salvar atividade: ${error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }
        if (window.confirm("Tem certeza que deseja deletar esta atividade?")) {
            try {
                const docRef = doc(db, dbPaths.atividades(userId), id);
                await deleteDoc(docRef);
                setStatusMessage("Atividade deletada com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar atividade:", error);
                setStatusMessage(`Erro ao deletar atividade: ${error.message}`);
            }
        }
    };

    // Lógica para adicionar um novo tipo de serviço
    const handleOpenAddServiceModal = () => {
        setIsAddServiceModalOpen(true);
        setNewService('');
        setStatusMessage('');
    };

    const handleCloseAddServiceModal = () => {
        setIsAddServiceModalOpen(false);
    };

    const handleSaveNewService = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }
        if (!newService.trim()) {
            setStatusMessage("O nome da atividade não pode ser vazio.");
            return;
        }

        const receitasRef = collection(db, dbPaths.receitas(userId));
        const newServiceData = {
            Nome: newService,
            Tipo: newService, // Usando o mesmo valor para Nome e Tipo por simplicidade
            Produtos: [],
        };

        try {
            await addDoc(receitasRef, newServiceData);
            setStatusMessage("Novo serviço adicionado com sucesso!");
            setTimeout(handleCloseAddServiceModal, 1500);
        } catch (error) {
            console.error("Erro ao adicionar novo serviço:", error);
            setStatusMessage(`Erro ao adicionar novo serviço: ${error.message}`);
        }
    };

    // Lógica de filtragem
    const filteredAtividades = atividades.filter(atividade => {
        const talhaoMatch = !selectedTalhaoFilter || atividade.talhao === selectedTalhaoFilter;
        
        const activityDate = atividade.data?.toDate();
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Ajustar a data final para incluir o dia inteiro
        if (end) {
            end.setDate(end.getDate() + 1);
        }

        const dateMatch = !activityDate || (!start || activityDate >= start) && (!end || activityDate < end);

        return talhaoMatch && dateMatch;
    });

    const sortedAtividades = filteredAtividades
        .filter(a => a.data)
        .sort((a, b) => b.data.toMillis() - a.data.toMillis());

    const availableServices = Array.from(new Set(receitas.map(r => r.Tipo)));
    const availableRecipes = receitas.filter(r => r.Tipo === formState.servico);

    const handleExportPdf = () => {
        // Use the global window.jsPDF if it's available
        let jsPDFConstructor = window.jsPDF;
        if (!jsPDFConstructor && window.jspdf && window.jspdf.jsPDF) {
            jsPDFConstructor = window.jspdf.jsPDF;
        }

        if (!jsPDFConstructor || !jsPDFConstructor.autoTable) { // Check for autotable plugin
            alert('As bibliotecas de PDF ainda não foram carregadas. Por favor, tente novamente em alguns segundos.');
            return;
        }

        const doc = new jsPDFConstructor(); // Use the determined constructor

        // Configurações e variáveis
        const logoUrl = 'https://placehold.co/100x50/34D399/FFFFFF?text=LOGO'; // URL para o logo
        const exportDate = new Date().toLocaleDateString('pt-BR');
        const talhaoName = selectedTalhaoFilter || 'Todos os Talhões';

        // Adicionar logo (cabeçalho)
        doc.addImage(logoUrl, 'PNG', 15, 10, 30, 15);

        // Título e informações
        doc.setFontSize(18);
        doc.text('Relatório de Atividades da Fazenda', 50, 20);
        doc.setFontSize(12);
        doc.text(`Talhão: ${talhaoName}`, 15, 42);
        doc.text(`Data de Exportação: ${exportDate}`, 15, 49);

        // Formatar dados da tabela
        const tableData = sortedAtividades.map(ativ => [
            ativ.data?.toDate().toLocaleDateString('pt-BR') || 'Data inválida',
            ativ.talhao,
            ativ.servico,
            ativ.produtos?.map(p => `${p.Nome} (${p.Dose} ${p.Unidade})`).join(', ') || '',
            ativ.observacao
        ]);

        const headers = [
            ['Data', 'Talhão', 'Serviço', 'Produtos', 'Observação']
        ];

        doc.autoTable({
            startY: 60,
            head: headers,
            body: tableData,
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 3,
                valign: 'middle',
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [52, 211, 153], // Cor esmeralda
                textColor: 255,
                halign: 'center',
            },
            bodyStyles: {
                textColor: [51, 51, 51],
            },
        });

        doc.save(`Relatorio_Atividades_${talhaoName}_${exportDate}.pdf`);
    };

    return (
        <div className="container mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <label className="text-sm font-medium">Talhão:</label>
                    <select
                        value={selectedTalhaoFilter}
                        onChange={(e) => setSelectedTalhaoFilter(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Todos</option>
                        {talhoes.map(talhao => (
                            <option key={talhao.id} value={talhao.Nome}>{talhao.Nome}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <label className="text-sm font-medium">De:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100" />
                </div>
                
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <label className="text-sm font-medium">Até:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100" />
                </div>
                
                <button
                    onClick={() => {
                        setSelectedTalhaoFilter('');
                        setStartDate(new Date(currentYear - 1, 6, 1).toISOString().slice(0, 10));
                        setEndDate(new Date(currentYear, 5, 30).toISOString().slice(0, 10));
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors w-full md:w-auto"
                >
                    Limpar Filtros
                </button>
            </div>
            
            <div className="flex justify-end mb-4 space-x-4 flex-wrap"> {/* Added flex-wrap here */}
                <button onClick={handleOpenAddServiceModal} className="px-6 py-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 mb-2 md:mb-0"> {/* Added margin-bottom for mobile */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span>Cadastrar Serviço</span>
                </button>
                <button onClick={handleExportPdf} className="px-6 py-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mb-2 md:mb-0"> {/* Added margin-bottom for mobile */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="h-5 w-5">
                      <path d="M19.5 14.25v-2.25H12a2.25 2.25 0 0 1-2.25-2.25V6a2.25 2.25 0 0 1 2.25-2.25h3.75a.75.75 0 0 1 .75.75v2.25m-15.75 7.5h6v-6h-6v6ZM9 8.25h6" />
                      <path d="M12 18.75v-6m-9 6v-6h9v6Zm9 0v-6h9v6Zm-9 0h9" />
                      <path d="M12 12.75V15h3.75a.75.75 0 0 1 .75.75v2.25h-3.75a2.25 2.25 0 0 1-2.25-2.25V15M12 12.75h-9"/>
                    </svg>
                    <span>Exportar para PDF</span>
                </button>
                <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 mb-2 md:mb-0"> {/* Added margin-bottom for mobile */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span>Adicionar Atividade</span>
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full"> {/* Added max-w-full here */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Talhão</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Serviço</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produtos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Observação</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAtividades.map(atividade => (
                            <tr key={atividade.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {atividade.data?.toDate().toLocaleDateString('pt-BR') || 'Data inválida'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{atividade.talhao}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{atividade.servico}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {atividade.produtos && atividade.produtos.map((produto, index) => (
                                        <div key={index}>
                                            <p className="font-semibold">{produto.Nome}</p>
                                            <p className="text-xs">{produto.Dose} {produto.Unidade}</p>
                                        </div>
                                    ))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{atividade.observacao}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleOpenModal(atividade)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors mr-4">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(atividade.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                        Deletar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <h3 className="text-2xl font-bold mb-4">{selectedAtividade ? 'Editar Atividade' : 'Adicionar Nova Atividade'}</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <select name="talhao" value={formState.talhao} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" required>
                            <option value="">Selecione um Talhão</option>
                            {talhoes.map(talhao => (
                                <option key={talhao.id} value={talhao.Nome}>{talhao.Nome}</option>
                            ))}
                        </select>
                        <input name="data" type="date" value={formState.data} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" required />

                         {/* Campo para selecionar o tipo de serviço */}
                        <select
                            name="servico"
                            value={formState.servico}
                            onChange={handleServiceTypeChange}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                            required
                        >
                            <option value="">Selecione um Tipo de Serviço</option>
                            {availableServices.map(servico => (
                                <option key={servico} value={servico}>{servico}</option>
                            ))}
                        </select>

                        {/* Campo para selecionar a receita com base no tipo de serviço */}
                        {formState.servico && (
                           <select
                                name="receitaNome"
                                value={formState.receitaNome}
                                onChange={handleRecipeChange}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                                required
                            >
                                <option value="">Selecione uma Receita</option>
                                {availableRecipes.map(receita => (
                                    <option key={receita.id} value={receita.Nome}>{receita.Nome}</option>
                                ))}
                            </select>
                        )}
                        
                        <div className="space-y-2 mt-4">
                            <h4 className="font-semibold text-lg">Produtos na Receita</h4>
                            {formState.produtos.length > 0 ? (
                                formState.produtos.map((produto, index) => (
                                    <div key={index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                        <p className="font-medium">{produto.Nome}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{produto.Dose} {produto.Unidade}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum produto nesta receita.</p>
                            )}
                        </div>

                        <textarea name="observacao" value={formState.observacao} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Observações"></textarea>
                        
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCloseModal} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                    {statusMessage && <p className="mt-4 text-center text-sm">{statusMessage}</p>}
                </Modal>
            )}
            
            {isAddServiceModalOpen && (
                <Modal onClose={handleCloseAddServiceModal}>
                    <h3 className="text-2xl font-bold mb-4">Cadastrar Novo Serviço</h3>
                    <form onSubmit={handleSaveNewService} className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ao cadastrar um serviço aqui, ele será adicionado à lista de Receitas como um tipo de serviço sem produtos associados. Você pode adicionar produtos a esta receita na página "Receitas".
                        </p>
                        <input
                            name="newService"
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                            placeholder="Nome da Atividade (ex: Adubação de Inverno)"
                            required
                        />
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCloseAddServiceModal} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                    {statusMessage && <p className="mt-4 text-center text-sm">{statusMessage}</p>}
                </Modal>
            )}
        </div>
    );
};

const ComprasPage = () => {
    const { compras, userId } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);
    const [formState, setFormState] = useState({
        nome: '', unidade: '', dataCompra: '', quantidade: '', preco: ''
    });
    const [statusMessage, setStatusMessage] = useState('');

    const handleOpenModal = (compra = null) => {
        setSelectedCompra(compra);
        setFormState(compra ? { ...compra, dataCompra: compra.dataCompra?.toDate().toISOString().slice(0, 10) || '' } : { nome: '', unidade: '', dataCompra: new Date().toISOString().slice(0, 10), quantidade: '', preco: '' });
        setIsModalOpen(true);
        setStatusMessage('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCompra(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }

        const comprasRef = collection(db, dbPaths.compras(userId));
        const compraData = {
            nome: formState.nome,
            unidade: formState.unidade,
            dataCompra: new Date(formState.dataCompra),
            quantidade: parseFloat(formState.quantidade) || 0,
            preco: parseFloat(formState.preco) || 0,
            timestamp: serverTimestamp(),
        };

        try {
            if (selectedCompra) {
                const docRef = doc(db, dbPaths.compras(userId), selectedCompra.id);
                await updateDoc(docRef, compraData);
                setStatusMessage("Compra atualizada com sucesso!");
            } else {
                await addDoc(comprasRef, compraData);
                setStatusMessage("Compra adicionada com sucesso!");
            }
            setTimeout(handleCloseModal, 1500);
        } catch (error) {
            console.error("Erro ao salvar compra:", error);
            setStatusMessage(`Erro ao salvar compra: ${error.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }
        if (window.confirm("Tem certeza que deseja deletar esta compra?")) {
            try {
                const docRef = doc(db, dbPaths.compras(userId), id);
                await deleteDoc(docRef);
                setStatusMessage("Compra deletada com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar compra:", error);
                setStatusMessage(`Erro ao deletar compra: ${error.message}`);
            }
        }
    };

    return (
        <div className="container mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">Gerenciamento de Compras</h2>
                <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    <span>Cadastrar Produto</span>
                </button>
            </div>

            <div className="overflow-x-auto max-w-full">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome do Produto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data da Compra</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantidade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {compras.map(compra => (
                            <tr key={compra.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{compra.nome}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{compra.unidade}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {compra.dataCompra?.toDate().toLocaleDateString('pt-BR') || 'Data inválida'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{compra.quantidade}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">R$ {compra.preco?.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleOpenModal(compra)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors mr-4">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(compra.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                        Deletar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={handleCloseModal}>
                    <h3 className="text-2xl font-bold mb-4">{selectedCompra ? 'Editar Compra' : 'Cadastrar Novo Produto'}</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <input name="nome" value={formState.nome} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Nome do Produto" required />
                        <input name="unidade" value={formState.unidade} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Unidade (ex: kg, L)" required />
                        <input name="dataCompra" type="date" value={formState.dataCompra} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" required />
                        <input name="quantidade" type="number" step="0.01" value={formState.quantidade} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Quantidade" required />
                        <input name="preco" type="number" step="0.01" value={formState.preco} onChange={handleFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Preço (R$)" required />
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCloseModal} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                    {statusMessage && <p className="mt-4 text-center text-sm">{statusMessage}</p>}
                </Modal>
            )}
        </div>
    );
};

const ColheitaPage = () => {
    const { colheitas, funcionarios, talhoes, userId } = useContext(AppContext);
    const [isFuncionarioModalOpen, setIsFuncionarioModalOpen] = useState(false);
    const [isColheitaModalOpen, setIsColheitaModalOpen] = useState(false);
    const [selectedFuncionario, setSelectedFuncionario] = useState(null);
    const [selectedColheita, setSelectedColheita] = useState(null);
    const [funcionarioFormState, setFuncionarioFormState] = useState({
        nome: '', dataN: '', rg: ''
    });
    const [colheitaFormState, setColheitaFormState] = useState({
        talhao: '', funcionario: '', alqueires: '', litros: '', preco: '', data: ''
    });
    const [statusMessage, setStatusMessage] = useState('');

    // Estados para os filtros
    const [selectedFuncionarioFilter, setSelectedFuncionarioFilter] = useState('');
    const [selectedTalhaoFilter, setSelectedTalhaoFilter] = useState('');

    // --- Funções para Funcionário ---
    const handleOpenFuncionarioModal = (func = null) => {
        setSelectedFuncionario(func);
        setFuncionarioFormState(func || { nome: '', dataN: '', rg: '' });
        setIsFuncionarioModalOpen(true);
        setStatusMessage('');
    };

    const handleCloseFuncionarioModal = () => {
        setIsFuncionarioModalOpen(false);
        setSelectedFuncionario(null);
    };

    const handleFuncionarioFormChange = (e) => {
        const { name, value } = e.target;
        setFuncionarioFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveFuncionario = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }

        const funcionariosRef = collection(db, dbPaths.funcionarios(userId));
        const funcionarioData = {
            nome: funcionarioFormState.nome,
            dataN: funcionarioFormState.dataN,
            rg: funcionarioFormState.rg,
            timestamp: serverTimestamp(),
        };

        try {
            if (selectedFuncionario) {
                const docRef = doc(db, dbPaths.funcionarios(userId), selectedFuncionario.id);
                await updateDoc(docRef, funcionarioData);
                setStatusMessage("Funcionário atualizado com sucesso!");
            } else {
                await addDoc(funcionariosRef, funcionarioData);
                setStatusMessage("Funcionário adicionado com sucesso!");
            }
            setTimeout(handleCloseFuncionarioModal, 1500);
        } catch (error) {
            console.error("Erro ao salvar funcionário:", error);
            setStatusMessage(`Erro ao salvar funcionário: ${error.message}`);
        }
    };

    const handleDeleteFuncionario = async (id) => {
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }
        if (window.confirm("Tem certeza que deseja deletar este funcionário?")) {
            try {
                const docRef = doc(db, dbPaths.funcionarios(userId), id);
                await deleteDoc(docRef);
                setStatusMessage("Funcionário deletado com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar funcionário:", error);
                setStatusMessage(`Erro ao deletar funcionário: ${error.message}`);
            }
        }
    };

    // --- Funções para Colheita ---
    const handleOpenColheitaModal = (colheita = null) => {
        setSelectedColheita(colheita);
        setColheitaFormState(colheita ? { ...colheita, data: colheita.data?.toDate().toISOString().slice(0, 10) || '' } : {
            talhao: talhoes[0]?.Nome || '',
            funcionario: funcionarios[0]?.nome || '',
            alqueires: '',
            litros: '',
            preco: '',
            data: new Date().toISOString().slice(0, 10)
        });
        setIsColheitaModalOpen(true);
        setStatusMessage('');
    };

    const handleCloseColheitaModal = () => {
        setIsColheitaModalOpen(false);
        setSelectedColheita(null);
    };

    const handleColheitaFormChange = (e) => {
        const { name, value } = e.target;
        setColheitaFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveColheita = async (e) => {
        e.preventDefault();
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }

        const colheitasRef = collection(db, dbPaths.colheitas(userId));
        const colheitaData = {
            talhao: colheitaFormState.talhao,
            funcionario: colheitaFormState.funcionario,
            alqueires: parseFloat(colheitaFormState.alqueires) || 0,
            litros: parseFloat(colheitaFormState.litros) || 0,
            preco: parseFloat(colheitaFormState.preco) || 0,
            data: new Date(colheitaFormState.data),
            timestamp: serverTimestamp(),
        };

        try {
            if (selectedColheita) {
                const docRef = doc(db, dbPaths.colheitas(userId), selectedColheita.id);
                await updateDoc(docRef, colheitaData);
                setStatusMessage("Colheita atualizada com sucesso!");
            } else {
                await addDoc(colheitasRef, colheitaData);
                setStatusMessage("Colheita adicionada com sucesso!");
            }
            setTimeout(handleCloseColheitaModal, 1500);
        } catch (error) {
            console.error("Erro ao salvar colheita:", error);
            setStatusMessage(`Erro ao salvar colheita: ${error.message}`);
        }
    };

    const handleDeleteColheita = async (id) => {
        if (!userId) {
            setStatusMessage("Erro: Nenhum usuário autenticado.");
            return;
        }
        if (window.confirm("Tem certeza que deseja deletar este registro de colheita?")) {
            try {
                const docRef = doc(db, dbPaths.colheitas(userId), id);
                await deleteDoc(docRef);
                setStatusMessage("Registro de colheita deletado com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar registro de colheita:", error);
                setStatusMessage(`Erro ao deletar registro de colheita: ${error.message}`);
            }
        }
    };

    // Lógica de filtragem para colheitas
    const filteredColheitas = colheitas.filter(colheita => {
        const funcionarioMatch = !selectedFuncionarioFilter || colheita.funcionario === selectedFuncionarioFilter;
        const talhaoMatch = !selectedTalhaoFilter || colheita.talhao === selectedTalhaoFilter;
        return funcionarioMatch && talhaoMatch;
    });

    return (
        <div className="container mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-6">Gerenciamento de Colheita</h2>

            {/* Filtros da Colheita */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4 md:space-y-0 md:space-x-4 mb-6 flex-wrap">
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <label className="text-sm font-medium">Talhão:</label>
                    <select
                        value={selectedTalhaoFilter}
                        onChange={(e) => setSelectedTalhaoFilter(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Todos</option>
                        {talhoes.map(talhao => (
                            <option key={talhao.id} value={talhao.Nome}>{talhao.Nome}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <label className="text-sm font-medium">Funcionário:</label>
                    <select
                        value={selectedFuncionarioFilter}
                        onChange={(e) => setSelectedFuncionarioFilter(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Todos</option>
                        {funcionarios.map(func => (
                            <option key={func.id} value={func.nome}>{func.nome}</option>
                        ))}
                    </select>
                </div>
                
                <button
                    onClick={() => {
                        setSelectedTalhaoFilter('');
                        setSelectedFuncionarioFilter('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors w-full md:w-auto"
                >
                    Limpar Filtros
                </button>
            </div>

            {/* Seção de Cadastro de Funcionários */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4 flex-wrap"> {/* Added flex-wrap */}
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Funcionários</h3>
                    <button onClick={() => handleOpenFuncionarioModal()} className="px-6 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <span>Cadastrar Funcionário</span>
                    </button>
                </div>
                <div className="overflow-x-auto max-w-full">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data Nasc.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">RG</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {funcionarios.map(func => (
                                <tr key={func.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{func.nome}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{func.dataN}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{func.rg}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenFuncionarioModal(func)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors mr-4">
                                            Editar
                                        </button>
                                        <button onClick={() => handleDeleteFuncionario(func.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                            Deletar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Seção de Cadastro de Colheita */}
            <div>
                <div className="flex justify-between items-center mb-4 flex-wrap"> {/* Added flex-wrap */}
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Registros de Colheita</h3>
                    <button onClick={() => handleOpenColheitaModal()} className="px-6 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <span>Cadastrar Colheita</span>
                    </button>
                </div>
                <div className="overflow-x-auto max-w-full">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Talhão</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Funcionário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Alqueires</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Litros</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredColheitas.map(colheita => (
                                <tr key={colheita.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {colheita.data?.toDate().toLocaleDateString('pt-BR') || 'Data inválida'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{colheita.talhao}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colheita.funcionario}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colheita.alqueires}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colheita.litros}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">R$ {colheita.preco?.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenColheitaModal(colheita)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors mr-4">
                                            Editar
                                        </button>
                                        <button onClick={() => handleDeleteColheita(colheita.id)} className="text-red-600 hover:text-red-900 transition-colors">
                                            Deletar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Cadastro/Edição de Funcionário */}
            {isFuncionarioModalOpen && (
                <Modal onClose={handleCloseFuncionarioModal}>
                    <h3 className="text-2xl font-bold mb-4">{selectedFuncionario ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}</h3>
                    <form onSubmit={handleSaveFuncionario} className="space-y-4">
                        <input name="nome" value={funcionarioFormState.nome} onChange={handleFuncionarioFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Nome Completo" required />
                        <input name="dataN" type="date" value={funcionarioFormState.dataN} onChange={handleFuncionarioFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Data de Nascimento" required />
                        <input name="rg" value={funcionarioFormState.rg} onChange={handleFuncionarioFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="RG" required />
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCloseFuncionarioModal} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                    {statusMessage && <p className="mt-4 text-center text-sm">{statusMessage}</p>}
                </Modal>
            )}

            {/* Modal de Cadastro/Edição de Colheita */}
            {isColheitaModalOpen && (
                <Modal onClose={handleCloseColheitaModal}>
                    <h3 className="text-2xl font-bold mb-4">{selectedColheita ? 'Editar Registro de Colheita' : 'Cadastrar Nova Colheita'}</h3>
                    <form onSubmit={handleSaveColheita} className="space-y-4">
                        <select name="talhao" value={colheitaFormState.talhao} onChange={handleColheitaFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" required>
                            <option value="">Selecione um Talhão</option>
                            {talhoes.map(talhao => (
                                <option key={talhao.id} value={talhao.Nome}>{talhao.Nome}</option>
                            ))}
                        </select>
                        <select name="funcionario" value={colheitaFormState.funcionario} onChange={handleColheitaFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" required>
                            <option value="">Selecione um Funcionário</option>
                            {funcionarios.map(func => (
                                <option key={func.id} value={func.nome}>{func.nome}</option>
                            ))}
                        </select>
                        <input name="alqueires" type="number" step="0.01" value={colheitaFormState.alqueires} onChange={handleColheitaFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Alqueires" required />
                        <input name="litros" type="number" step="0.01" value={colheitaFormState.litros} onChange={handleColheitaFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Litros" required />
                        <input name="preco" type="number" step="0.01" value={colheitaFormState.preco} onChange={handleColheitaFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" placeholder="Preço (R$)" required />
                        <input name="data" type="date" value={colheitaFormState.data} onChange={handleColheitaFormChange} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" required />
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={handleCloseColheitaModal} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors">Salvar</button>
                        </div>
                    </form>
                    {statusMessage && <p className="mt-4 text-center text-sm">{statusMessage}</p>}
                </Modal>
            )}
        </div>
    );
};

// Novo componente para Listar Produção
const ProducaoPage = () => {
    const { colheitas, funcionarios, talhoes } = useContext(AppContext);
    const [selectedFuncionarioFilter, setSelectedFuncionarioFilter] = useState('');
    const [selectedTalhaoFilter, setSelectedTalhaoFilter] = useState('');

    // Lógica de filtragem
    const filteredProducao = colheitas.filter(colheita => {
        const funcionarioMatch = !selectedFuncionarioFilter || colheita.funcionario === selectedFuncionarioFilter;
        const talhaoMatch = !selectedTalhaoFilter || colheita.talhao === selectedTalhaoFilter;
        return funcionarioMatch && talhaoMatch;
    });

    // Cálculo da produção total
    const totalLitros = filteredProducao.reduce((sum, item) => sum + (item.litros || 0), 0);
    const totalAlqueires = filteredProducao.reduce((sum, item) => sum + (item.alqueires || 0), 0);
    const litrosEmAlqueires = totalLitros / 60; // 60 litros por alqueire
    const producaoTotalAlqueires = totalAlqueires + litrosEmAlqueires;

    // Cálculo do valor total da produção
    const totalValorProducao = filteredProducao.reduce((sum, item) => {
        const alqueiresConsolidados = (item.alqueires || 0) + ((item.litros || 0) / 60);
        return sum + (alqueiresConsolidados * (item.preco || 0));
    }, 0);

    return (
        <div className="container mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-6">Listar Produção</h2>

            {/* Filtros da Produção */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <label className="text-sm font-medium">Talhão:</label>
                    <select
                        value={selectedTalhaoFilter}
                        onChange={(e) => setSelectedTalhaoFilter(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Todos</option>
                        {talhoes.map(talhao => (
                            <option key={talhao.id} value={talhao.Nome}>{talhao.Nome}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center space-x-2 w-full md:w-auto">
                    <label className="text-sm font-medium">Funcionário:</label>
                    <select
                        value={selectedFuncionarioFilter}
                        onChange={(e) => setSelectedFuncionarioFilter(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    >
                        <option value="">Todos</option>
                        {funcionarios.map(func => (
                            <option key={func.id} value={func.nome}>{func.nome}</option>
                        ))}
                    </select>
                </div>
                
                <button
                    onClick={() => {
                        setSelectedTalhaoFilter('');
                        setSelectedFuncionarioFilter('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors w-full md:w-auto"
                >
                    Limpar Filtros
                </button>
            </div>

            {/* Resumo da Produção */}
            <div className="bg-emerald-100 dark:bg-emerald-900 p-6 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-700 mb-6">
                <h3 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-200 mb-4">Resumo da Produção Filtrada</h3>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    Total de Litros: <span className="font-bold">{totalLitros.toFixed(2)} L</span>
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                    Total de Alqueires (Litros convertidos): <span className="font-bold">{litrosEmAlqueires.toFixed(2)} alqueires</span>
                </p>
                <p className="text-xl text-emerald-700 dark:text-emerald-300 mt-4">
                    **Produção Total (Alqueires Consolidados): <span className="font-bold">{producaoTotalAlqueires.toFixed(2)} alqueires**</span>
                </p>
                <p className="text-xl text-emerald-700 dark:text-emerald-300 mt-2">
                    **Valor Total da Produção: <span className="font-bold">R$ {totalValorProducao.toFixed(2)}**</span>
                </p>
            </div>

            {/* Tabela de Registros de Colheita Filtrados */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto max-w-full">
                <h3 className="2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Registros Detalhados</h3>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Talhão</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Funcionário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Alqueires</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Litros</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preço</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredProducao.map(colheita => (
                            <tr key={colheita.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {colheita.data?.toDate().toLocaleDateString('pt-BR') || 'Data inválida'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{colheita.talhao}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colheita.funcionario}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colheita.alqueires}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colheita.litros}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">R$ {colheita.preco?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// Componente principal da aplicação
export default function App() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [userId, setUserId] = useState(null);
    const [talhoes, setTalhoes] = useState([]);
    const [atividades, setAtividades] = useState([]);
    const [receitas, setReceitas] = useState([]);
    const [compras, setCompras] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [colheitas, setColheitas] = useState([]);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Load PDF libraries dynamically
    useEffect(() => {
        const loadPdfLibraries = async () => {
            // Check if jsPDF is already loaded
            if (!window.jsPDF) {
                const scriptJsPDF = document.createElement('script');
                scriptJsPDF.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                scriptJsPDF.onload = () => {
                    // Ensure jsPDF is available globally after loading
                    // It should typically be window.jsPDF for UMD bundle
                    if (window.jspdf && window.jspdf.jsPDF) { // Some UMD bundles might nest it
                        window.jsPDF = window.jspdf.jsPDF;
                    } else if (!window.jsPDF) { // Fallback if not directly on window
                        console.error("jsPDF not found on window after loading UMD bundle.");
                        return;
                    }

                    // Now load jspdf-autotable, which depends on window.jsPDF
                    if (!window.jsPDF.autoTable) { // Check if autotable plugin is loaded
                        const scriptAutoTable = document.createElement('script');
                        scriptAutoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
                        document.head.appendChild(scriptAutoTable);
                        scriptAutoTable.onload = () => {
                            console.log("jspdf-autotable loaded.");
                        };
                        scriptAutoTable.onerror = (e) => {
                            console.error("Failed to load jspdf-autotable:", e);
                        };
                    } else {
                        console.log("jspdf-autotable already loaded.");
                    }
                };
                scriptJsPDF.onerror = (e) => {
                    console.error("Failed to load jsPDF:", e);
                };
                document.head.appendChild(scriptJsPDF);
            } else {
                console.log("jsPDF already loaded.");
                // If jsPDF is already there, check for autotable
                if (!window.jsPDF.autoTable) {
                    const scriptAutoTable = document.createElement('script');
                    scriptAutoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
                    document.head.appendChild(scriptAutoTable);
                    scriptAutoTable.onload = () => {
                        console.log("jspdf-autotable loaded (pre-existing jsPDF).");
                    };
                    scriptAutoTable.onerror = (e) => {
                        console.error("Failed to load jspdf-autotable (pre-existing jsPDF):", e);
                    };
                }
            }
        };
        loadPdfLibraries();
    }, []);

    useEffect(() => {
        if (!app || !auth || !db) {
            console.error("Firebase não inicializado. Verifique a configuração.");
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setIsAuthReady(true);
            } else {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Erro ao autenticar:", error);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isAuthReady && userId) {
            console.log("Usuário autenticado:", userId);

            // Fetch Talhões
            const qTalhoes = query(collection(db, dbPaths.talhoes(userId)));
            const unsubscribeTalhoes = onSnapshot(qTalhoes, (snapshot) => {
                const fetchedTalhoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTalhoes(fetchedTalhoes);
                if (fetchedTalhoes.length === 0) {
                    console.log("Coleção de talhões vazia. Adicionando dados de exemplo.");
                    addDoc(collection(db, dbPaths.talhoes(userId)), { Nome: 'C-01', Cultivar: 'Catuaí', Area: 5.0, N_Plantas: 5000, Plantio: 2020, Altitude: 900 });
                }
            });

            // Fetch Atividades
            const qAtividades = query(collection(db, dbPaths.atividades(userId)));
            const unsubscribeAtividades = onSnapshot(qAtividades, (snapshot) => {
                const fetchedAtividades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAtividades(fetchedAtividades);
                if (fetchedAtividades.length === 0) {
                    console.log("Coleção de atividades vazia. Adicionando dados de exemplo.");
                    addDoc(collection(db, dbPaths.atividades(userId)), { talhao: 'C-01', data: new Date(), servico: 'Adubação', produtos: [{ Nome: 'Fertilizante X', Dose: '100', Unidade: 'kg' }], observacao: 'Adubação de rotina' });
                }
            });

            // Fetch Receitas
            const qReceitas = query(collection(db, dbPaths.receitas(userId)));
            const unsubscribeReceitas = onSnapshot(qReceitas, (snapshot) => {
                const fetchedReceitas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setReceitas(fetchedReceitas);
                if (fetchedReceitas.length === 0) {
                    console.log("Coleção de receitas vazia. Adicionando dados de exemplo.");
                    addDoc(collection(db, dbPaths.receitas(userId)), { Nome: 'Adubação de Verão', Tipo: 'Adubação', Produtos: [{ Nome: 'NPK 20-10-10', Dose: '150', Unidade: 'kg/ha' }] });
                    addDoc(collection(db, dbPaths.receitas(userId)), { Nome: 'Controle de Pragas', Tipo: 'Foliar', Produtos: [{ Nome: 'Inseticida A', Dose: '1', Unidade: 'L/ha' }] });
                }
            });

            // Fetch Compras
            const qCompras = query(collection(db, dbPaths.compras(userId)));
            const unsubscribeCompras = onSnapshot(qCompras, (snapshot) => {
                const fetchedCompras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCompras(fetchedCompras);
                if (fetchedCompras.length === 0) {
                    console.log("Coleção de compras vazia. Adicionando dados de exemplo.");
                    addDoc(collection(db, dbPaths.compras(userId)), { nome: 'Adubo NPK', unidade: 'sacos', dataCompra: new Date('2024-01-15'), quantidade: 10, preco: 150.00 });
                }
            });

            // Fetch Funcionarios
            const qFuncionarios = query(collection(db, dbPaths.funcionarios(userId)));
            const unsubscribeFuncionarios = onSnapshot(qFuncionarios, (snapshot) => {
                const fetchedFuncionarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFuncionarios(fetchedFuncionarios);
                if (fetchedFuncionarios.length === 0) {
                    console.log("Coleção de funcionários vazia. Adicionando dados de exemplo.");
                    addDoc(collection(db, dbPaths.funcionarios(userId)), { nome: 'João Silva', dataN: '1990-05-20', rg: '123456789' });
                }
            });

            // Fetch Colheitas
            const qColheitas = query(collection(db, dbPaths.colheitas(userId)));
            const unsubscribeColheitas = onSnapshot(qColheitas, (snapshot) => {
                const fetchedColheitas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setColheitas(fetchedColheitas);
                if (fetchedColheitas.length === 0) {
                    console.log("Coleção de colheitas vazia. Adicionando dados de exemplo.");
                    addDoc(collection(db, dbPaths.colheitas(userId)), { talhao: 'C-01', funcionario: 'João Silva', alqueires: 2.5, litros: 500, preco: 5.00, data: new Date('2024-07-20') });
                }
            });

            return () => {
                unsubscribeTalhoes();
                unsubscribeAtividades();
                unsubscribeReceitas();
                unsubscribeCompras();
                unsubscribeFuncionarios();
                unsubscribeColheitas();
            };
        }
    }, [isAuthReady, userId]);

    const contextValue = {
        talhoes,
        atividades,
        receitas,
        compras,
        funcionarios,
        colheitas,
        userId,
        isAuthReady,
    };

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <p className="text-xl">Carregando aplicação...</p>
            </div>
        );
    }

    return (
        <AppContext.Provider value={contextValue}>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
                <Header setCurrentPage={setCurrentPage} />
                <main className="container mx-auto p-6 flex-grow">
                    {currentPage === 'dashboard' && <DashboardPage />}
                    {currentPage === 'talhoes' && <TalhoesPage />}
                    {currentPage === 'receitas' && <ReceitasPage />}
                    {currentPage === 'atividades' && <AtividadesPage />}
                    {currentPage === 'compras' && <ComprasPage />}
                    {currentPage === 'colheita' && <ColheitaPage />}
                    {currentPage === 'producao' && <ProducaoPage />}
                </main>
                <Footer userId={userId} />
            </div>
        </AppContext.Provider>
    );
}
