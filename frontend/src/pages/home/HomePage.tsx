export const HomePage = () => {
  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0' }}>
      <h1>Welcome to Becha-Kena!</h1>
      <p>This is the home page. Navigate to /login to test the auth flow.</p>
      
      {/* Placeholder height to test scrolling and sticky header */}
      <div style={{ height: '1000px', backgroundColor: 'var(--color-bg-white)', marginTop: 'var(--space-lg)', borderRadius: 'var(--radius-md)' }}></div>
    </div>
  );
};
