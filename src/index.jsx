const rootElement = document.getElementById("root");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
