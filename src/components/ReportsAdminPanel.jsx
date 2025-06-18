import React from 'react';
import ReportsDashboard from './ReportsDashboard';

function ReportsAdminPanel({ authenticatedFetch }) {
    return (
        <section className="reports-section">
            <h2>Dashboard y Reportes</h2>
            <ReportsDashboard authenticatedFetch={authenticatedFetch} />
        </section>
    );
}
export default ReportsAdminPanel;