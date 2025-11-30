export default function ConsoleDashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Bienvenido</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Selecciona una opción del menú lateral para comenzar a administrar el contenido.
                    </p>
                </div>
            </div>
        </div>
    );
}
