export default function ConsoleDashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold admin-text mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="admin-surface p-6 rounded-xl shadow-sm border admin-border">
                    <h3 className="text-lg font-semibold admin-text mb-2">Bienvenido</h3>
                    <p className="admin-text-muted">
                        Selecciona una opción del menú lateral para comenzar a administrar el contenido.
                    </p>
                </div>
            </div>
        </div>
    );
}
