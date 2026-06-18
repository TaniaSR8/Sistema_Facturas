import Sidebar from './Sidebar.jsx';

export default function MainLayout({ children }) {
  return (
    <div className="admin-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
