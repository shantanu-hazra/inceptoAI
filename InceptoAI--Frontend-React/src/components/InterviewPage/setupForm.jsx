import React from "react";

const SetupForm = ({
  company,
  setCompany,
  role,
  setRole,
  handleSetupSubmit,
}) => {
  const styles = {
    container: {
      height: "100vh",
      display: "flex",
      alignItems: "center",
    },
    setupCard: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      width: "100%",
      maxWidth: "600px",
      margin: "0 auto",
      overflow: "hidden",
    },
    setupHeader: {
      padding: "24px",
      borderBottom: "1px solid #eaeaea",
      textAlign: "center",
    },
    setupTitle: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#333",
      margin: "0 0 8px 0",
    },
    setupSubtitle: {
      fontSize: "16px",
      color: "#666",
      margin: "0",
    },
    setupBody: {
      padding: "24px",
    },
    setupForm: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    formLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#555",
    },
    inputWrapper: {
      position: "relative",
    },
    formInput: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "16px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      transition: "border-color 0.2s",
      outline: "none",
    },
    submitButton: {
      marginTop: "16px",
      padding: "14px 24px",
      backgroundColor: "#4a6cf7",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.setupCard}>
        <div style={styles.setupHeader}>
          <h2 style={styles.setupTitle}>Welcome to Interview Analyzer</h2>
          <p style={styles.setupSubtitle}>
            Practice for your next interview with AI-powered analysis of your
            responses.
          </p>
        </div>
        <div style={styles.setupBody}>
          <form onSubmit={handleSetupSubmit} style={styles.setupForm}>
            <div style={styles.formGroup}>
              <label htmlFor="company" style={styles.formLabel}>
                Company
              </label>
              <div style={styles.inputWrapper}>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Google, Amazon, Microsoft"
                  style={styles.formInput}
                  required
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="role" style={styles.formLabel}>
                Job Role
              </label>
              <div style={styles.inputWrapper}>
                <input
                  id="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                  style={styles.formInput}
                  required
                />
              </div>
            </div>

            <button type="submit" style={styles.submitButton}>
              Start Interview
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;
